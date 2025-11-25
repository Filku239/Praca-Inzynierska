const checkDeletePermission = (req, res, next) => {
    const targetUserId = req.params.id;
    const loggedInUserId = req.user.id;
    const loggedInUserRole = req.user.role;
    if (loggedInUserRole === 'admin') {
    return next(); 
  }
  if (String(loggedInUserId) === String(targetUserId)) {
    return next();
  }


  return res.status(403).json({ 
    message: 'Brak uprawnień do wykonania tej akcji.' 
  });
};

module.exports = checkDeletePermission;