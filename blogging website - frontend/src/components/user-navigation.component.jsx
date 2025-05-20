import { useContext } from "react";
import { UserContext } from "../App";
import AnimationWrapper from "../common/page-animation";
import {Link} from "react-router-dom";
import { removeFromsession } from "../common/session";

const UserNavigationPanel = () => {

    const { userAuth: {username}, setUserAuth } = useContext(UserContext);

    const signOutUser = () => {
        removeFromsession("user");
        setUserAuth({ access_token: null})
    }

    return (
        <AnimationWrapper
            className="absolute right-0 z-50"
            transition={{ duration: 0.2 }}
        >
            <div className="bg-white absolute right-0 border border-grey w-60 overflow-hidden duration-200">
                <Link to="/editor" className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rr-file-edit"></i>
                    <p>Write</p>
                </Link>
                <Link to={`/user/${username}`} className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rr-user"></i>
                    <p>Profile</p>
                </Link>
                <Link to="/dashboard/blogs" className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rr-dashboard"></i>
                    <p>Dashborad</p>
                </Link>
                <Link to="/settings/edit-profile" className="flex gap-2 link md:hidden pl-8 py-4">
                    <i className="fi fi-rr-settings"></i>
                    <p>Settings</p>
                </Link>
                <span className="absolute border-t border-grey -ml-6 w-[200%]"></span>
                <button className="flex gap-2 link md:hidden pl-8 py-4"
                    onClick={signOutUser}
                >
                    <h1 className="font-bold text-xl mg-1">Sign Out</h1>
                </button>
            </div>
        </AnimationWrapper>
    )
}

export default UserNavigationPanel;