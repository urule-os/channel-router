export interface Config {
  port: number;
  host: string;
  natsUrl: string;
  registryUrl: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT ?? '3006', 10),
    host: process.env.HOST ?? '0.0.0.0',
    natsUrl: process.env.NATS_URL ?? 'nats://localhost:4222',
    registryUrl: process.env.REGISTRY_URL ?? 'http://localhost:3001',
  };
}
