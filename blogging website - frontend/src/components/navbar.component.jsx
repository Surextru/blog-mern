import { useContext, useState } from "react";
import {Link, Navigate, Outlet, useNavigate} from "react-router-dom";
import logo from "../imgs/logo.png";
import { UserContext } from "../App";
import UserNavigationPanel from "./user-navigation.component";

const Navbar = () => {

    const [ searchBoxVisibility, setSearchBoxVisibility] = useState(false)
    const [ userNavPanel, setuserNavPanel] = useState(false);
    let navigate = useNavigate();

    const handleSearch = (e) => {
        let query = e.target.value;

        if(e.keyCode == 13 && query.length){
            navigate(`/search/${query}`);
        }
    }

    const handleSearchBoxVisibility = () => {
        setSearchBoxVisibility( currentVal => !currentVal)
    }
    const handleUserNavPanel = () => {
        setuserNavPanel(currentVal => !currentVal);
    }
    
    const handleUserNavPanelBlur = () => {
        setTimeout(()=>{
            setuserNavPanel(false);
        }, 200)
    }
    

    const { userAuth: {access_token, profile_img }, userAuth } = useContext(UserContext);

    // console.log(access_token);
    return (
        <>
            {/* Cargamos el navbar */}
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img className="w-full" src={logo} alt="logo" />
                </Link>

                <div className={"absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show " + (searchBoxVisibility ? "show" : "hide")}>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="w-full md:w-auto bg-grey p-4 pl-6 pr-[12%] md:pr-6 rounded-full md:pl-12"
                        onKeyDown={handleSearch}
                    />
                    <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-x1 text-dark-grey"></i>
                </div>

                <div className="flex items-center gap-3 md:gap-6 ml-auto">
                    <button className="md:hidden bg-grey w-12 h-12 rounded-full items-center justify-center"
                    onClick={handleSearchBoxVisibility}
                    >
                        <i className="fi fi-rr-search text-xl"></i>
                    </button>

                    <Link to="/editor" className="hidden md:flex gap-2 link rounded-full">
                            <i className="fi fi-rr-file-edit"></i>
                            <p>Write</p>
                    </Link>


                    {
                        access_token ?
                        <>
                            <Link to="/dashboard/notification">
                                <button className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10">
                                    <i className="fi fi-rs-bell text-2xl block mt-1s"></i>
                                </button>
                            </Link>
                            <div className="relative">
                                <button className="w-12 h-12 mt-1"
                                onClick={handleUserNavPanel}
                                onBlur={handleUserNavPanelBlur}>
                                    <img src={profile_img} alt="" className="w-full h-full object-cover rounded-full"/> 
                                </button>
                                {
                                    userNavPanel ? <UserNavigationPanel /> : ""

                                }
                            </div>
                        </> : 
                        <>
                            <Link to="/signin" className="btn-dark py-2">
                                Sign in
                            </Link>
                            <Link to="/signup" className="btn-light py-2">
                                Sign up
                            </Link>
                        </>
                    }
                </div> 
            </nav>
            {/* De la misma forma que en django ustilo plantillas, lo que consigo poniendo
                outlet justo despues del navbar es que el resto del contendio de la pagina vaya a outlet
                es decir, que con outlet, le estamos indicando a react donde tiene que ir el contendio del resto de paginas
                No se si me estoy explicando. es como un localizador que grita, aquí! el resto del código va aquí!. 
            */}
            <Outlet />
        </>
    )
}

export default Navbar;