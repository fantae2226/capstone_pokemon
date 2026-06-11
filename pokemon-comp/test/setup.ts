import { beforeAll ,afterEach, vi } from 'vitest';
import {cleanup} from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));


beforeAll(() => {
    class ResizeObserverMock {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});