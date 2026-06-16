import '@testing-library/jest-dom';

// react-router-dom v7 uses the Web Encoding API internally. jsdom does not
// polyfill TextEncoder/TextDecoder by default, so we pull them from Node's
// built-in `util` module (available in the jsdom test environment).
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
// reason: TextDecoder from Node util has a compatible interface but TypeScript
// types don't perfectly align with the DOM definition; the cast is safe here.
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
