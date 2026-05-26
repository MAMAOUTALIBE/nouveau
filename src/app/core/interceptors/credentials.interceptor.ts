import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Intercepteur qui force `withCredentials: true` sur toutes les requêtes
 * vers l'API interne, afin que les cookies httpOnly de session
 * (`rh_access`, `rh_refresh`) soient envoyés automatiquement par le navigateur.
 *
 * - Active uniquement pour les URLs qui ciblent `environment.api.baseUrl`
 *   (relatif comme `/api/v1` ou absolu) ou toute autre URL relative `/api/...`.
 * - Ne touche pas aux appels vers des origines externes (Firebase, services
 *   tiers, etc.) pour éviter d'exposer les cookies hors domaine.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.api.baseUrl;
  const isInternalApi = req.url.startsWith(base) || req.url.startsWith('/api/');
  if (!isInternalApi) {
    return next(req);
  }
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
