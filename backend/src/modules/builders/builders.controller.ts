import type { Request, Response } from 'express';
import * as service from './builders.service.js';
import { ok, created, noContent } from '../../utils/respond.js';
import { audit, clientIp } from '../../utils/audit.js';

export async function list(req: Request, res: Response) {
  return ok(res, await service.list(req.query));
}

export async function options(_req: Request, res: Response) {
  return ok(res, await service.options());
}

export async function getOne(req: Request, res: Response) {
  return ok(res, await service.getById(Number(req.params.id)));
}

export async function create(req: Request, res: Response) {
  const builder = await service.create(req.body, req.user!.id);
  audit({ actorId: req.user!.id, action: 'builder.create', entityType: 'builder', entityId: (builder as any)?.id, ip: clientIp(req) });
  return created(res, builder);
}

export async function update(req: Request, res: Response) {
  const builder = await service.update(Number(req.params.id), req.body);
  audit({ actorId: req.user!.id, action: 'builder.update', entityType: 'builder', entityId: req.params.id, ip: clientIp(req) });
  return ok(res, builder);
}

export async function remove(req: Request, res: Response) {
  await service.remove(Number(req.params.id));
  audit({ actorId: req.user!.id, action: 'builder.delete', entityType: 'builder', entityId: req.params.id, ip: clientIp(req) });
  return noContent(res);
}
