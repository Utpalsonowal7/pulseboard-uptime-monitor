import type { RequestHandler } from "express";
import * as monitorService from "../services/monitor.service.js";

const routeParam = (req: Parameters<RequestHandler>[0], name: string): string => {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

export const list: RequestHandler = async (_req, res) => { res.json({ data: await monitorService.listMonitors() }); };
export const create: RequestHandler = async (req, res) => {
  const monitor = await monitorService.createMonitor(res.locals.validatedBody as monitorService.MonitorInput);
  res.status(201).json({ data: monitor });
};
export const getById: RequestHandler = async (req, res) => { res.json({ data: await monitorService.getMonitor(routeParam(req, "id")) }); };
export const update: RequestHandler = async (req, res) => {
  res.json({ data: await monitorService.updateMonitor(routeParam(req, "id"), res.locals.validatedBody as Partial<monitorService.MonitorInput>) });
};
export const remove: RequestHandler = async (req, res) => {
  await monitorService.deleteMonitor(routeParam(req, "id"));
  res.status(204).send();
};
export const checks: RequestHandler = async (req, res) => { res.json({ data: await monitorService.getMonitorChecks(routeParam(req, "id")) }); };
export const stats: RequestHandler = async (req, res) => { res.json({ data: (await monitorService.getMonitor(routeParam(req, "id"))).stats }); };
export const incidents: RequestHandler = async (req, res) => { res.json({ data: await monitorService.getMonitorIncidents(routeParam(req, "id")) }); };
export const publicStatus: RequestHandler = async (req, res) => { res.json({ data: await monitorService.getPublicStatus(routeParam(req, "slug")) }); };
