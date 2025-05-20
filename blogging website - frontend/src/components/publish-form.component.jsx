import {Navigate, useNavigate, useParams} from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import {Toaster, toast} from "react-hot-toast";
import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";

const PublishForm = () => {

    let characterLimit = 200;
    let tagLimit = 10;

    let { blog_id } = useParams();

    let { blog, blog:{ title, banner, content, tags, des, author}, setBlog, editorState, setEditorState, textEditor, setTextEditor  } = useContext(EditorContext)

    let { userAuth: {access_token} } = useContext(UserContext);

    let navigate = useNavigate();

    const handleClose = () => {
        setEditorState("editor");
    }

    const handleTitleChange = (e) => {
        let input = e.target;
        setBlog({...blog, title: input.value});
    }

    const handleDescription = (e) => {
        let input = e.target;
        setBlog({...blog, des: input.value});

    }

    const handleTopic = (e) => {
        if(e.keyCode == 13 || e.keyCode == 188) {
            e.preventDefault();
            let tag = e.target.value;

            if (tags.length < tagLimit){
                if (!tags.includes(tag) && tag.length){
                    setBlog({ ...blog, tags: [ ...tags, tag] });
                }
            } else {
                toast.error("You reach the limit of topics")
            }
            e.target.value = "";
        }
    }

    const publishBlog = (e) => {

        if(e.target.className.includes("disable")) return ;

        //validate data
        if (!title) return toast.error("write a title to publish.");
        if (!des || des.length > characterLimit) return toast.error("Write a description. 200 max.");
        if (!tags) return toast.error("Write at least one topic");

        let loadingToast = toast.loading("Publishing...");
        e.target.classList.add('disable');
        
        let blogObj = {
            title, banner, content, tags, des, draft: false
        }
        

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", { ...blogObj, id: blog_id}, {
            headers:{
                'Authorization': `Bearer ${access_token}`
            }
        }).then( () => {
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);
            toast.success("Blog published successfuly");
            setTimeout(() => {
                navigate("/")
            }, 500);
        }).catch(({response}) => {
            e.target.classList.remove('disable');
            toast.dismiss(loadingToast);


            return toast.error(`Error publishing your blog, please try again. Error: ${response.data.error}`);
        })
    
    }


    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
                <Toaster />
                <button 
                    className="w-12 h-12 absolute right-[5vw] z-12 top-[4%] lg:top-[6%]"
                    onClick={handleClose}>
                    
                    <i className="fi fi-br-cross"></i>
                </button>

                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1">Preview</p>

                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
                        <img src={banner} alt="" />
                    </div>

                    <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">{title}</h1>
                    <p className="font-gelasio line-clamp text-xl leading-7 mt-4">{des}</p>

                </div>
                <div className="border-grey lg:border-1 lg:pl-8">
                    <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
                    <input 
                        type="text" 
                        className="input-box pl-4" 
                        defaultValue={title} 
                        placeholder="Blog title"
                        onChange={handleTitleChange}
                    />

                    <p className="text-dark-grey mb-2 mt-9">Short description</p>
                    <textarea className="h-40 resize-none leading-7 input-box pl-4"maxLength={characterLimit}
                    onChange={handleDescription}></textarea>

                    <p className="mt-1 text-dark-grey text-sm text-right">{characterLimit - des.length} characters left</p>
                    <p>Topics - ( Helps is searching)</p>
                    <div className="relative input-box pl-2 py-2 pb-4">
                        <input type="text" placeholder="Topic" className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
                            onKeyDown={handleTopic}/>
                        {
                            tags.map((tag, i) => {
                                return (<Tag tag={tag} tagIndex={i} key={i}/>)
                            })
                        }
                    </div>
                    <p className="mt-1 text-dark-grey text-sm text-right">{tagLimit - tags.length} tags left</p>
                
                    <button className="btn-dark"
                        onClick={publishBlog}
                    >Publish</button>
                </div>

            </section>
        </AnimationWrapper>
    )

}

export default PublishForm;