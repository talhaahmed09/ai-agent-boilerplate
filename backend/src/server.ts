/**
 * Boots the app with the in-memory repository for local/demo runs. Production
 * swaps InMemoryUserRepository for PrismaUserRepository here (documented, not
 * wired). The behavioral validator boots this server and drives it over HTTP.
 */
import { buildApp } from './app';
import { InMemoryUserRepository } from './data/userRepository';
import { InMemoryProductStore } from './data/productStore';
import { InMemoryOrderStore } from './data/orderStore';

const port = Number(process.env.PORT ?? 3001);
// demo: in-memory stores for products and orders
const app = buildApp({
  users: new InMemoryUserRepository(),
  products: new InMemoryProductStore(),
  orders: new InMemoryOrderStore(),
});

app
  .listen({ port, host: '0.0.0.0' })
  .then((address) => {
    // eslint-disable-next-line no-console
    console.log(`registration API listening on ${address}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
