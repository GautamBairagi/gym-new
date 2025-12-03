import { registerUser, loginUser , fetchUserById,
  modifyUser,
  removeUser, fetchAdmins, fetchDashboardStats, loginMemberService} from "./auth.service.js";



export const register = async (req, res, next) => {
  try {
    // pass req.body directly to service
    const user = await registerUser(req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};


export const getUserById = async (req, res, next) => {
  try {
    const data = await fetchUserById(Number(req.params.id));
    res.json({ success: true, user: data });
  } catch (err) {
    next(err);
  }
};


export const getAdmins = async (req, res, next) => {
  try {
    const data = await fetchAdmins(); // service se fetch

    res.json({
      success: true,
      admins: data
    });
  } catch (err) {
    next(err);
  }
};



export const updateUser = async (req, res, next) => {
  try {
    const data = await modifyUser(Number(req.params.id), req.body);
    res.json({ success: true, user: data });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const data = await removeUser(Number(req.params.id));
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await fetchDashboardStats(); // service se fetch

    res.json({
      success: true,
      dashboard: data
    });
  } catch (err) {
    next(err);
  }
};




export const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.body);
    res.json({
      success: true,
      token: data.token,
      user: {
        id: data.user.id,
        fullName: data.user.fullName,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role.name || null,
        branchId: data.user.branchId,
        branchName: data.user.branch?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
};


export const loginMember = async (req, res, next) => {
  try {
    const data = await loginMemberService(req.body);
    res.json({
      success: true,
      token: data.token,
      member: {
        id: data.member.id,
        fullName: data.member.fullName,
        email: data.member.email,
        phone: data.member.phone,
        branchId: data.member.branchId,
        branchName: data.member.branch?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
