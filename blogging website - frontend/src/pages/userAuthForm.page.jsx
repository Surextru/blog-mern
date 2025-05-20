import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png"
import { json, Link, Navigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { useRef, useContext } from "react";
import { Toaster, toast } from 'react-hot-toast';
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({type}) => {

    const authForm = useRef();

    let { userAuth: {access_token}, setUserAuth } = useContext(UserContext);

    const userAuthThroughServer = (serverRoute, formData) => {
        
        let url = import.meta.env.VITE_SERVER_DOMAIN + serverRoute;

        //connection to backend
        axios.post(url, formData)
        .then((response) => {


            storeInSession("user", JSON.stringify(response.data));
            setUserAuth(response.data);
        })
        .catch( ({response}) => {
            // console.log(response.data.error);
            toast.error(response.data.error);
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let serverRoute = type == "sign-in" ? "/signin": "/singup"
        
        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password
    
        let form = new FormData(formElement);
        let formData = {};
        for(let [key, value] of form.entries()){
            formData[key] = value;
        }
        console.log(formData);

        let { fullname, email, password } = formData;

        if(type == "sign-up"){
            if(fullname.length < 3) {return toast.error("Your name must be at least 3 letter long.")}
        }
        if(!email.length) {return toast.error("Enter Email")}
        if(!emailRegex.test(email)) { return toast.error("Invalid email format") }
        if(!passwordRegex.test(password)) { return toast.error("Invalid password!") }
        
        userAuthThroughServer(serverRoute, formData);
        
    }

    const handleGoogleAuth = (e) => {
        e.preventDefault();
        authWithGoogle().then((user)=>{
            console.log("handleGoogleAuth - user",user);
            let serverRoute = "/google-auth";

            let formData = {
                access_token : user.accessToken
            }
            userAuthThroughServer(serverRoute, formData)
        })
        .catch((err) => {
            toast.error("trouble login through google")
        });
    }

    return (
        access_token ? 
        <Navigate to="/" />
        :
        <AnimationWrapper>
            <section className="h-cover flex items-center justify-center">
                <Toaster />
                <form ref={authForm} id="formElement" className="w-[80%] max-w-[400px]">
                    <h1 className="text-4xl font-gelasio capitalize text-center mb-245">
                        {type == "sign-in" ? "Welcome back": "Join us today"}
                    </h1>
                    {
                        type != "sign-in" ? <InputBox name="fullname" type="text" id="fullname" placeholder="Full Name" icon="fi-sr-user" />: ""
                    }
                    <InputBox name="email" type="text" id="email" placeholder="Email" icon="fi-sr-at" />
                    <InputBox name="password" type="password" id="password" placeholder="Password" icon="fi-sr-key"  /> 
                    <button  
                        className="btn-dark center mt-14"
                        type="submit"
                        onClick={handleSubmit}
                    >
                        { type.replace("-", " ")}
                    </button>

                    <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-back font-bold">
                        <hr className="w-1/2 border-black" />
                        <p>or</p>
                        <hr className="w-1/2 border-black" />
                    </div>

                    <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
                    onClick={handleGoogleAuth}>
                        <img src={googleIcon} alt="" className="w-5" />
                        continue with google
                    </button>

                    {
                        type == "sign-in" ?
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have an account ? <Link to="/signup" className="underline text-black text-xl ml-1">Join us today</Link>
                        </p> : 
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already a member ? <Link to="/signin" className="underline text-black text-xl ml-1">Sign in here</Link>
                        </p>
                    }
                </form>
            </section>
        </AnimationWrapper>
    )
}

export default UserAuthForm;