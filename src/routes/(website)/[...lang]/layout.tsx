import {component$, Slot} from '@builder.io/qwik';
import {Nav} from '~/components/nav/nav';

export default component$(() => {
    return <Nav><Slot/></Nav>;
});
