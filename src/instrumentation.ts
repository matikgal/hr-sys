export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { default: resourcesDefault } = await import('@opentelemetry/resources') as any;
    const { SEMRESATTRS_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');

    const sdk = new NodeSDK({
      resource: new resourcesDefault.Resource({
        [SEMRESATTRS_SERVICE_NAME]: 'hr-system',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://jaeger:4318/v1/traces',
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
  }
}
