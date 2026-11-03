const sameSiteValues = new Set(["lax", "strict", "none"]);

const getJwtCookieOptions = (req) => {
  const sameSite = (process.env.COOKIE__SAME_SITE || "lax").toLowerCase();
  if (!sameSiteValues.has(sameSite)) {
    throw new Error('COOKIE__SAME_SITE must be "lax", "strict", or "none"');
  }

  const secureSetting = (process.env.COOKIE__SECURE || "auto").toLowerCase();
  let secure;
  if (secureSetting === "auto") {
    secure = req.secure;
  } else if (secureSetting === "true") {
    secure = true;
  } else if (secureSetting === "false") {
    secure = false;
  } else {
    throw new Error('COOKIE__SECURE must be "auto", "true", or "false"');
  }

  if (sameSite === "none" && !secure) {
    throw new Error('COOKIE__SAME_SITE="none" requires COOKIE__SECURE to resolve to true');
  }

  return {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite,
    secure,
  };
};

module.exports = getJwtCookieOptions;
