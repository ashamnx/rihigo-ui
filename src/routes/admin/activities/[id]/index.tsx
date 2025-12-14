import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Form, Link, routeAction$, routeLoader$ } from "@builder.io/qwik-city";
import { apiClient, authenticatedRequest } from "~/utils/api-client";
import { getActivityById, getAtolls, getIslands, updateActivity } from "~/services/activity-api";
import type { UpdateActivityInput, Activity } from '~/types/activity';
import type { MediaItem, OwnerType, PrivacyLevel } from "~/types/media";
import { MediaGalleryManager } from "~/components/admin/MediaGalleryManager";
import { MediaLibrary } from "~/components/admin/MediaLibrary";

export const useActivity = routeLoader$(async (requestEvent) => {
  const activityId = requestEvent.params.id;

  try {
    const activity = await getActivityById(activityId, 'en');
    return { success: true, data: activity };
  } catch (error) {
    console.error('Failed to load activity:', error);
    return { success: false, error: 'Activity not found' };
  }
});

export const useAtolls = routeLoader$(async () => {
  try {
    return await getAtolls();
  } catch (error) {
    console.error('Failed to load atolls:', error);
    return [];
  }
});

export const useIslands = routeLoader$(async () => {
  try {
    return await getIslands();
  } catch (error) {
    console.error('Failed to load islands:', error);
    return [];
  }
});

export const useVendors = routeLoader$(async (requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      return await apiClient.vendors.list(token, { status: 'active' }, 1, 100);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      return { success: false, data: [], error_message: 'Failed to load vendors' };
    }
  });
});

export const useRelatedActivities = routeLoader$(async (requestEvent) => {
  const activityId = requestEvent.params.id;
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const response = await apiClient.activities.listAdmin(1, 10, token);
      if (response.success && response.data) {
        // Filter out current activity and limit to 4
        const related = (response.data as Activity[])
          .filter(a => a.id !== activityId)
          .slice(0, 4);
        return { success: true, data: related };
      }
      return { success: false, data: [] };
    } catch {
      return { success: false, data: [] };
    }
  });
});

export const useUpdateActivity = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const activityId = data.id as string;
      const updateInput: UpdateActivityInput = {
        slug: data.slug ? (data.slug as string).toLowerCase().replace(/\s+/g, '-') : undefined,
        category_id: data.category_id ? parseInt(data.category_id as string) : undefined,
        island_id: data.island_id ? parseInt(data.island_id as string) : undefined,
        vendor_id: data.vendor_id ? (data.vendor_id as string) : undefined,
        status: data.status as 'draft' | 'published' | 'archived' | undefined,
        seo_metadata: {
          title: data.seo_title as string,
          description: data.seo_description as string,
          keywords: data.seo_keywords ? (data.seo_keywords as string).split(',').map(k => k.trim()) : [],
          og_image: data.og_image as string || undefined
        }
      };

      const result = await updateActivity(activityId, updateInput, token);

      if (result) {
        return {
          success: true,
          data: result,
          message: "Activity updated successfully"
        };
      }

      return {
        success: false,
        message: "Failed to update activity"
      };
    } catch (error) {
      console.error("Error updating activity:", error);
      return {
        success: false,
        message: "An error occurred while updating the activity"
      };
    }
  });
});

// Media route actions
export const useGetMedia = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const activityId = requestEvent.params.id;
      const response = await apiClient.media.list(token, {
        owner_type: 'activity',
        owner_id: activityId,
        page: parseInt(data.page as string) || 1,
        page_size: parseInt(data.perPage as string) || 50,
      });

      if (response.success && response.data) {
        // Transform API response to match MediaLibrary expected format
        const mediaItems = response.data.map((item: MediaItem) => ({
          id: item.id,
          filename: item.original_filename || item.filename,
          uploaded: item.created_at,
          type: item.mime_type.startsWith('video/') ? 'video' : 'image',
          variants: item.variants?.map(v => v.url) || [],
          // For Cloudflare Images, extract accountHash; for R2, use cdnUrl directly
          accountHash: item.cdn_url ? extractAccountHash(item.cdn_url) : undefined,
          cdnUrl: item.cdn_url,
          meta: {
            activityId: item.owner_id,
            tags: item.tags,
            description: item.metadata?.description,
            alt: item.metadata?.alt,
          },
          // Keep original data for reference
          _original: item,
        }));

        return { success: true, data: mediaItems };
      }

      return { success: false, message: response.error_message || 'Failed to load media' };
    } catch (error) {
      console.error('Error loading media:', error);
      return { success: false, message: 'Failed to load media' };
    }
  });
});

export const useGetPresignedUrl = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const response = await apiClient.media.getPresignedUpload({
        filename: data.filename as string,
        content_type: data.content_type as string,
        file_size: parseInt(data.file_size as string),
      }, token);

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      }

      return { success: false, message: response.error_message || 'Failed to get upload URL' };
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      return { success: false, message: 'Failed to get upload URL' };
    }
  });
});

export const useDeleteMedia = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    try {
      const response = await apiClient.media.delete(data.mediaId as string, token);

      if (response.success) {
        return { success: true };
      }

      return { success: false, message: response.error_message || 'Failed to delete media' };
    } catch (error) {
      console.error('Error deleting media:', error);
      return { success: false, message: 'Failed to delete media' };
    }
  });
});

// Route action to create media record (Step 2: After client uploads to Cloudflare R2)
export const useCreateMediaRecord = routeAction$(async (data, requestEvent) => {
  return authenticatedRequest(requestEvent, async (token) => {
    console.log('useCreateMediaRecord: Creating media record with data:', data);

    // Validate required fields
    if (!data.storage_key) {
      console.error('useCreateMediaRecord: storage_key is missing');
      return {
        success: false,
        error_message: 'storage_key is required',
      };
    }

    // Presigned uploads go to R2, so always use cloudflare_r2
    const storageProvider = 'cloudflare_r2';
    const storageKey = data.storage_key as string;

    // Construct CDN URL for public files
    let cdnUrl: string | undefined;
    if (data.privacy_level === 'public' || !data.privacy_level) {
      const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
      if (r2PublicUrl) {
        cdnUrl = `${r2PublicUrl}/${storageKey}`;
      }
    }

    console.log("useCreateMediaRecord: Calling apiClient.media.create with storageKey:", storageKey);
    // Create media record
    const result = await apiClient.media.create(
      {
        filename: storageKey.split('/').pop() || (data.original_filename as string),
        original_filename: data.original_filename as string,
        mime_type: data.content_type as string,
        file_size: typeof data.file_size === 'number' ? data.file_size : parseInt(data.file_size as string),
        storage_provider: storageProvider,
        storage_key: storageKey,
        cdn_url: cdnUrl,
        privacy_level: (data.privacy_level as PrivacyLevel) || 'public',
        owner_type: (data.owner_type as OwnerType) || 'activity',
        owner_id: (data.owner_id as string) || 'general',
        tags: data.tags ? JSON.parse(data.tags as string) : undefined,
        metadata: data.metadata ? JSON.parse(data.metadata as string) : undefined,
      },
      token
    );

    console.log("useCreateMediaRecord: result:", result);

    if (!result.success || !result.data) {
      console.error('Failed to create media record:', result.error_message);
      return {
        success: false,
        error_message: result.error_message || 'Failed to create media record',
      };
    }

    console.log("useCreateMediaRecord: result.data:", result.data);
    return {
      success: true,
      data: result.data,
      message: 'File uploaded successfully',
    };
  });
});

// Helper function to extract account hash from Cloudflare Images URL
function extractAccountHash(url: string): string | undefined {
  // Cloudflare Images URL format: https://imagedelivery.net/{accountHash}/{imageId}/{variant}
  const match = url.match(/imagedelivery\.net\/([^/]+)/);
  return match?.[1];
}

const sections = [
  { id: 'basic', label: 'Basic Info', icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z' },
  { id: 'media', label: 'Media', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
  { id: 'location', label: 'Location', icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
  { id: 'seo', label: 'SEO', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
  { id: 'stats', label: 'Stats', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  { id: 'layout', label: 'Layout', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
];

// Define the media item type for the gallery
interface GalleryMediaItem {
  id: string;
  filename: string;
  uploaded: string;
  type: 'image' | 'video';
  variants: string[];
  accountHash?: string;
  /** Direct CDN URL for R2 storage */
  cdnUrl?: string;
  meta?: {
    activityId?: string;
    tags?: string[];
    description?: string;
    alt?: string;
  };
}

export default component$(() => {
  const activityData = useActivity();
  const atolls = useAtolls();
  const islands = useIslands();
  const vendorsResponse = useVendors();
  const relatedActivitiesData = useRelatedActivities();
  const updateActivityAction = useUpdateActivity();
  const selectedAtoll = useSignal<number | undefined>();
  const activeSection = useSignal('basic');

  // Media actions
  const getMediaAction = useGetMedia();
  const deleteMediaAction = useDeleteMedia();
  const getPresignedUrlAction = useGetPresignedUrl();
  const createMediaRecordAction = useCreateMediaRecord();

  // Media state
  const selectedMedia = useStore<{ items: GalleryMediaItem[] }>({ items: [] });

  // OG Image state for Social sharing
  const ogImageUrl = useSignal<string>('');

  // SEO fields state for live preview
  const seoTitle = useSignal<string>('');
  const seoDescription = useSignal<string>('');
  const seoSlug = useSignal<string>('');

  // Handle media change from gallery manager
  const handleMediaChange = $((media: GalleryMediaItem[]) => {
    selectedMedia.items = media;
  });

  // Handle OG image selection from media library
  const handleOgImageSelect = $((media: GalleryMediaItem[]) => {
    if (media.length > 0) {
      const selected = media[0];
      // Get the best URL for OG image (prefer large variant or hero)
      if (selected.accountHash) {
        // Cloudflare Images URL format: https://imagedelivery.net/{accountHash}/{imageId}/{variant}
        // Use 'hero' variant for OG images (1920x1080, ideal for social media)
        ogImageUrl.value = `https://imagedelivery.net/${selected.accountHash}/${selected.id}/hero`;
      } else if (selected.cdnUrl) {
        // R2 storage: use cdnUrl directly
        ogImageUrl.value = selected.cdnUrl;
      } else if (selected.variants && selected.variants.length > 0) {
        // Fallback to first variant URL
        ogImageUrl.value = selected.variants[0];
      }
    }
  });

  // Handle not found
  if (!activityData.value.success || !activityData.value.data) {
    return (
      <div class="min-h-[60vh] flex items-center justify-center">
        <div class="text-center">
          <div class="size-20 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-6">
            <svg class="size-10 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold mb-2">Activity Not Found</h1>
          <p class="text-base-content/60 mb-6">The activity you are looking for does not exist or has been removed.</p>
          <Link href="/admin/activities" class="btn btn-primary">
            Back to Activities
          </Link>
        </div>
      </div>
    );
  }

  const activity = activityData.value.data;

  // Filter islands by selected atoll
  const filteredIslands = selectedAtoll.value
    ? islands.value.filter(i => i.atoll_id === selectedAtoll.value)
    : islands.value;

  const vendors = vendorsResponse.value.data || [];
  const relatedActivities = relatedActivitiesData.value.data || [];

  const title = activity.translations?.en?.title || activity.seo_metadata.title || activity.slug;
  const packageCount = activity.packages?.length || 0;

  return (
    <div class="min-h-screen">
      {/* Sticky Header */}
      <div class="sticky top-0 z-30 bg-base-100/95 backdrop-blur-sm border-b border-base-200 -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div class="py-4">
          {/* Breadcrumb & Title Row */}
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div class="min-w-0">
              <div class="breadcrumbs text-sm mb-1">
                <ul>
                  <li><Link href="/admin" class="text-base-content/60 hover:text-base-content">Dashboard</Link></li>
                  <li><Link href="/admin/activities" class="text-base-content/60 hover:text-base-content">Activities</Link></li>
                  <li class="text-base-content/40 truncate max-w-[200px]">{title}</li>
                </ul>
              </div>
              <div class="flex items-center gap-3">
                <h1
                  class="text-xl font-bold truncate"
                  style={{ viewTransitionName: `admin-activity-title-${activity.id}` }}
                >
                  {title}
                </h1>
                <div class={`badge badge-sm ${activity.status === 'published' ? 'badge-success' : activity.status === 'draft' ? 'badge-warning' : 'badge-error'}`}>
                  {activity.status}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="flex items-center gap-2 flex-shrink-0">
              <a
                href={`/en-US/activities/${activity.slug}`}
                target="_blank"
                class="btn btn-ghost btn-sm gap-2"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span class="hidden sm:inline">Preview</span>
              </a>
              <Link
                href={`/admin/activities/${activity.id}/builder`}
                class="btn btn-outline btn-sm gap-2"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span class="hidden sm:inline">Page Builder</span>
              </Link>
              <Link
                href={`/admin/activities/${activity.id}/packages`}
                class="btn btn-primary btn-sm gap-2"
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span class="hidden sm:inline">Packages</span>
                <span class="badge badge-sm">{packageCount}</span>
              </Link>
            </div>
          </div>

          {/* Section Navigation */}
          <div class="flex items-center gap-1 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                class={`btn btn-sm gap-2 flex-shrink-0 ${activeSection.value === section.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick$={() => activeSection.value = section.id}
              >
                <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d={section.icon} />
                </svg>
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div class="mt-6 space-y-3">
        {updateActivityAction.value?.success && (
          <div class="alert alert-success">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{updateActivityAction.value.message}</span>
          </div>
        )}

        {updateActivityAction.value?.success === false && (
          <div class="alert alert-error">
            <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{updateActivityAction.value.message}</span>
          </div>
        )}
      </div>

      <Form action={updateActivityAction} class="mt-6">
        <input type="hidden" value={activity.id} name="id" />

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div class="xl:col-span-2 space-y-6">
            {/* Basic Information */}
            <section id="basic" class="scroll-mt-40">
              <div class="card bg-base-200">
                <div class="card-body">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg class="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="font-semibold">Basic Information</h2>
                      <p class="text-sm text-base-content/60">Core activity details and settings</p>
                    </div>
                  </div>

                  <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">URL Slug</legend>
                    <input
                      type="text"
                      name="slug"
                      class="input input-bordered w-full"
                      value={seoSlug.value || activity.slug}
                      required
                      pattern="[a-z0-9-]+"
                      title="Only lowercase letters, numbers, and hyphens"
                      onInput$={(e) => seoSlug.value = (e.target as HTMLInputElement).value}
                    />
                    <p class="label text-xs text-base-content/50">
                      /en-US/activities/{seoSlug.value || activity.slug}
                    </p>
                  </fieldset>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                      <legend class="fieldset-legend">Category</legend>
                      <input
                        type="number"
                        name="category_id"
                        class="input input-bordered w-full"
                        value={activity.category_id || ''}
                        placeholder="Category ID"
                        min="1"
                      />
                      {activity.category && (
                        <p class="label text-xs text-base-content/50">
                          {activity.category.icon} {activity.category.name}
                        </p>
                      )}
                    </fieldset>

                    <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                      <legend class="fieldset-legend">Status</legend>
                      <select name="status" class="select select-bordered w-full" value={activity.status} required>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </fieldset>
                  </div>

                  <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">Vendor</legend>
                    <select
                      name="vendor_id"
                      class="select select-bordered w-full"
                      value={activity.vendor_id || ''}
                    >
                      <option value="">No vendor assigned</option>
                      {vendors.map((vendor: any) => {
                        const label = vendor.status !== 'verified'
                          ? `${vendor.business_name} (${vendor.status})`
                          : vendor.business_name;
                        return (
                          <option key={vendor.id} value={vendor.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </fieldset>
                </div>
              </div>
            </section>

            {/* Media Gallery */}
            <section id="media" class="scroll-mt-40">
              <div class="card bg-base-200">
                <div class="card-body">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="size-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <svg class="size-5 text-info" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="font-semibold">Media Gallery</h2>
                      <p class="text-sm text-base-content/60">Images and videos for this activity</p>
                    </div>
                  </div>

                  <MediaGalleryManager
                    activityId={activity.id}
                    selectedMedia={selectedMedia.items}
                    onMediaChange={handleMediaChange}
                    maxItems={20}
                    allowReorder={true}
                    getMediaAction={getMediaAction}
                    deleteAction={deleteMediaAction}
                    getPresignedUrlAction={getPresignedUrlAction}
                    createMediaRecordAction={createMediaRecordAction}
                  />

                  <div class="mt-4 text-sm text-base-content/60">
                    <p>The first image will be used as the featured image for listings and social media sharing.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Location */}
            <section id="location" class="scroll-mt-40">
              <div class="card bg-base-200">
                <div class="card-body">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="size-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <svg class="size-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="font-semibold">Location</h2>
                      <p class="text-sm text-base-content/60">Where this activity takes place</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                      <legend class="fieldset-legend">Atoll</legend>
                      <select
                        class="select select-bordered w-full"
                        value={activity.island?.atoll_id || ''}
                        onChange$={(e) => {
                          const value = (e.target as HTMLSelectElement).value;
                          selectedAtoll.value = value ? parseInt(value) : undefined;
                        }}
                      >
                        <option value="">Select atoll</option>
                        {atolls.value.map((atoll) => (
                          <option key={atoll.id} value={atoll.id}>
                            {`${atoll.code} - ${atoll.name}`}
                          </option>
                        ))}
                      </select>
                    </fieldset>

                    <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                      <legend class="fieldset-legend">Island</legend>
                      <select name="island_id" class="select select-bordered w-full" value={activity.island_id || ''}>
                        <option value="">Select island</option>
                        {filteredIslands.map((island) => (
                          <option key={island.id} value={island.id}>
                            {`${island.name} (${island.type})`}
                          </option>
                        ))}
                      </select>
                      {activity.island && (
                        <p class="label text-xs text-base-content/50">
                          Current: {activity.island.name}
                        </p>
                      )}
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* SEO */}
            <section id="seo" class="scroll-mt-40">
              <div class="card bg-base-200">
                <div class="card-body">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <svg class="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <div>
                      <h2 class="font-semibold">SEO & Social</h2>
                      <p class="text-sm text-base-content/60">Search engine and social media optimization</p>
                    </div>
                  </div>

                  <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">Meta Title</legend>
                    <input
                      type="text"
                      name="seo_title"
                      class="input input-bordered w-full"
                      value={seoTitle.value || activity.seo_metadata.title || ''}
                      required
                      maxLength={60}
                      onInput$={(e) => seoTitle.value = (e.target as HTMLInputElement).value}
                    />
                    <p class="label text-xs text-base-content/50">50-60 characters recommended</p>
                  </fieldset>

                  <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">Meta Description</legend>
                    <textarea
                      name="seo_description"
                      class="textarea textarea-bordered w-full h-24"
                      required
                      maxLength={160}
                      value={seoDescription.value || activity.seo_metadata.description || ''}
                      onInput$={(e) => seoDescription.value = (e.target as HTMLTextAreaElement).value}
                    />
                    <p class="label text-xs text-base-content/50">150-160 characters recommended</p>
                  </fieldset>

                  <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">Keywords</legend>
                    <input
                      type="text"
                      name="seo_keywords"
                      class="input input-bordered w-full"
                      value={activity.seo_metadata.keywords?.join(', ') || ''}
                      placeholder="maldives, snorkeling, diving..."
                    />
                    <p class="label text-xs text-base-content/50">Comma separated</p>
                  </fieldset>

                  <fieldset class="fieldset bg-base-100 border-base-300 rounded-box border p-4">
                    <legend class="fieldset-legend">Social Image</legend>
                    <div class="flex gap-2">
                      <input
                        type="url"
                        name="og_image"
                        class="input input-bordered flex-1"
                        value={ogImageUrl.value || activity.seo_metadata.og_image || ''}
                        placeholder="https://..."
                        onInput$={(e) => ogImageUrl.value = (e.target as HTMLInputElement).value}
                      />
                      <MediaLibrary
                        onSelectMedia={handleOgImageSelect}
                        multiSelect={false}
                        activityId={activity.id}
                        getMediaAction={getMediaAction}
                        getPresignedUrlAction={getPresignedUrlAction}
                        createMediaRecordAction={createMediaRecordAction}
                        deleteAction={deleteMediaAction}
                        defaultPrivacyLevel="public"
                      />
                    </div>
                    <p class="label text-xs text-base-content/50">For Facebook, Twitter cards (1200x630px recommended)</p>
                    {/* Image Preview */}
                    {(ogImageUrl.value || activity.seo_metadata.og_image) && (
                      <div class="mt-3">
                        <p class="text-xs text-base-content/50 mb-2">Preview:</p>
                        <div class="relative aspect-1200/630 max-w-md bg-base-200 rounded-lg overflow-hidden">
                          <img
                            src={ogImageUrl.value || activity.seo_metadata.og_image}
                            alt="Social media preview"
                            class="w-full h-full object-cover"
                            width={1200}
                            height={630}
                          />
                          <button
                            type="button"
                            class="absolute top-2 right-2 btn btn-circle btn-sm btn-error"
                            onClick$={() => ogImageUrl.value = ''}
                            title="Remove image"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </fieldset>

                  {/* Search Preview */}
                  <div class="mt-4 p-4 bg-base-100 rounded-lg">
                    <p class="text-xs text-base-content/50 mb-2">Search Preview (Live)</p>
                    <div class="space-y-1">
                      <p class="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                        {seoTitle.value || activity.seo_metadata.title || title}
                      </p>
                      <p class="text-green-700 text-sm">
                        rihigo.com/en-US/activities/{seoSlug.value || activity.slug}
                      </p>
                      <p class="text-sm text-base-content/70 line-clamp-2">
                        {seoDescription.value || activity.seo_metadata.description || 'No description set'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Page Layout */}
            <section id="layout" class="scroll-mt-40">
              <div class="card bg-base-200">
                <div class="card-body">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <svg class="size-5 text-warning" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      </div>
                      <div>
                        <h2 class="font-semibold">Page Layout</h2>
                        <p class="text-sm text-base-content/60">{activity.page_layout.length || 0} components configured</p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/activities/${activity.id}/builder`}
                      class="btn btn-primary btn-sm gap-2"
                    >
                      <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                      Edit Layout
                    </Link>
                  </div>

                  {activity.page_layout.length > 0 ? (
                    <div class="flex flex-wrap gap-2">
                      {activity.page_layout.map((component, index) => (
                        <div key={index} class="badge badge-lg badge-outline gap-2">
                          <span class="capitalize">{component.type.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div class="text-center py-8 text-base-content/50">
                      <svg class="size-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                      </svg>
                      <p>No layout components yet</p>
                      <p class="text-sm">Use the Page Builder to add content</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Right Column */}
          <div class="space-y-6">
            {/* Stats Card */}
            <section id="stats" class="scroll-mt-40">
              <div class="card bg-base-200">
                <div class="card-body">
                  <h3 class="font-semibold mb-4">Performance</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-base-content/60">Reviews</span>
                      <div class="text-right">
                        <span class="font-semibold">{activity.review_count}</span>
                        {activity.review_count > 0 && (
                          <span class="text-warning ml-2">
                            {activity.review_score.toFixed(1)} ★
                          </span>
                        )}
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-base-content/60">Packages</span>
                      <span class="font-semibold">{packageCount}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-base-content/60">Starting Price</span>
                      <span class="font-semibold text-primary">
                        ${activity.min_price_usd.toFixed(0)} USD
                      </span>
                    </div>
                    <div class="divider my-2"></div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-base-content/60">Created</span>
                      <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-base-content/60">Updated</span>
                      <span>{new Date(activity.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <div class="card bg-base-200">
              <div class="card-body">
                <h3 class="font-semibold mb-4">Quick Links</h3>
                <div class="space-y-2">
                  <Link
                    href={`/admin/activities/${activity.id}/packages`}
                    class="btn btn-ghost btn-sm w-full justify-start gap-3"
                  >
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    Manage Packages
                    <span class="badge badge-sm ml-auto">{packageCount}</span>
                  </Link>
                  <Link
                    href={`/admin/activities/${activity.id}/builder`}
                    class="btn btn-ghost btn-sm w-full justify-start gap-3"
                  >
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Page Builder
                  </Link>
                  <a
                    href={`/en-US/activities/${activity.slug}`}
                    target="_blank"
                    class="btn btn-ghost btn-sm w-full justify-start gap-3"
                  >
                    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    View Live Page
                  </a>
                </div>
              </div>
            </div>

            {/* Save Button (Sticky on Desktop) */}
            <div class="card bg-base-200 xl:sticky xl:top-44">
              <div class="card-body">
                <button type="submit" class="btn btn-primary w-full gap-2">
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Save Changes
                </button>
                <Link href="/admin/activities" class="btn btn-ghost btn-sm w-full mt-2">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Form>

      {/* Related Activities */}
      {relatedActivities.length > 0 && (
        <section class="mt-12">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Other Activities</h2>
            <Link href="/admin/activities" class="btn btn-ghost btn-sm">
              View All
            </Link>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedActivities.map((related: Activity) => {
              const relatedTitle = related.translations?.en?.title || related.seo_metadata.title || related.slug;
              return (
                <Link
                  key={related.id}
                  href={`/admin/activities/${related.id}`}
                  class="card bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <div class="card-body p-4">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="font-medium line-clamp-2 text-sm">{relatedTitle}</h3>
                      <span class={`badge badge-xs flex-shrink-0 ${
                        related.status === 'published' ? 'badge-success' :
                        related.status === 'draft' ? 'badge-warning' : 'badge-ghost'
                      }`}>
                        {related.status}
                      </span>
                    </div>
                    <div class="flex items-center justify-between mt-2 text-xs text-base-content/60">
                      {related.category && (
                        <span>{related.category.icon} {related.category.name}</span>
                      )}
                      {related.min_price_usd > 0 && (
                        <span class="font-medium text-primary">${related.min_price_usd.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Edit Activity | Admin | Rihigo",
  meta: [
    {
      name: "description",
      content: "Edit activity details and settings",
    },
  ],
};
