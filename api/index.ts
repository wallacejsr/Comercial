import { VercelRequest, VercelResponse } from "@vercel/node";
import { getApp } from "../server/app";

const app = getApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express app is a function (req, res) compatible with Vercel request/response
  return (app as any)(req, res);
}
