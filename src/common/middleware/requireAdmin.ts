export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      data: null,
      meta: {},
      error: {
        code: "FORBIDDEN",
        message: "Admin access required",
      },
    });
  }

  next();
}