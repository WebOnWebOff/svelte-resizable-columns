import '@testing-library/jest-dom/extend-expect';
import App from './App.svelte';
import { render, wait } from '@testing-library/svelte';

describe('render', () => {
  it('programmatically change props', async () => {
    expect.hasAssertions();

    const { component, getByText } = render(App, { props: { name: 'world' } });

    expect(getByText('Hello world!')).toBeInTheDocument();

    component.$set({ name: 'foo' });

    await wait(() => expect(getByText('Hello foo!')).toBeInTheDocument());
  });
});
