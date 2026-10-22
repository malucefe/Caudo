import { n8nOrigin } from './admin-metrics.service';

describe('n8nOrigin', () => {
  it('usa N8N_BASE_URL si existe', () => {
    expect(n8nOrigin('http://n8n:5678/', 'http://otro:1/webhook/x')).toBe('http://n8n:5678');
  });
  it('deriva el origen del webhook', () => {
    expect(n8nOrigin(undefined, 'http://n8n:5678/webhook/caudo-recomendaciones')).toBe('http://n8n:5678');
  });
  it('devuelve null sin configuración o con URL inválida', () => {
    expect(n8nOrigin()).toBeNull();
    expect(n8nOrigin('no-es-url')).toBeNull();
  });
});
