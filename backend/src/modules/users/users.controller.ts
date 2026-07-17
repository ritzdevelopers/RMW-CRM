import type { Request, Response } from 'express';
import * as service from './users.service.js';
import { ok, created, noContent } from '../../utils/respond.js';
import { audit, clientIp } from '../../utils/audit.js';

export async function list(req: Request, res: Response) {
  return ok(res, await service.list(req.query));
}
export async function assignable(_req: Request, res: Response) {
  return ok(res, await service.assignable());
}
export async function getOne(req: Request, res: Response) {
  return ok(res, await service.getById(Number(req.params.id)));
}
export async function create(req: Request, res: Response) {
  const user = await service.create(req.body);
  audit({ actorId: req.user!.id, action: 'user.create', entityType: 'user', entityId: (user as any)?.id, ip: clientIp(req) });
  return created(res, user);
}
export async function update(req: Request, res: Response) {
  const user = await service.update(Number(req.params.id), req.body);
  audit({ actorId: req.user!.id, action: 'user.update', entityType: 'user', entityId: req.params.id, ip: clientIp(req) });
  return ok(res, user);
}
export async function remove(req: Request, res: Response) {
  await service.remove(Number(req.params.id), req.user!.id);
  audit({ actorId: req.user!.id, action: 'user.delete', entityType: 'user', entityId: req.params.id, ip: clientIp(req) });
  return noContent(res);
}
export async function updateProfile(req: Request, res: Response) {
  const user = await service.update(req.user!.id, req.body);
  return ok(res, user);
}
