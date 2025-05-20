import {Link, useNavigate, useParams} from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { uploadImage } from "../common/aws";
import { useContext, useEffect } from "react";
import {Toaster, toast} from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import Editorjs from "@editorjs/editorjs";
import { tools } from "./tools.component";
import { UserContext } from "../App";
import axios from "axios";

const BlogEditor = () => {

    let { blog, blog:{ title, banner, content, tags, des, author}, setBlog, editorState, setEditorState, textEditor, setTextEditor } = useContext(EditorContext);

    let { userAuth: {access_token} } = useContext(UserContext);
    let { blog_id } = useParams();
    let navigate = useNavigate();

    useEffect(() => {
        setTextEditor(new Editorjs({
            holder: "textEditor",
            data: Array.isArray(content) ? content [0] : content,
            tools: tools,
            placeholder: 'Escribe!'
        }));
    }, [])

    useEffect(() => {
        console.log("blog.title CAMBIÓ A:", blog.title);
      }, [blog.title]);

    //Banner
    const handleBannerUpload  = (e) => {
        let img = e.target.files[0];

        if(img){
            let uploadToast = toast.loading("Uploading...");
            uploadImage(img)
            .then((url) => {
                toast.dismiss(uploadToast);

                if(url){
                    // blogBannerRef.current.src = url
                    toast.success("Nice");
                    setBlog({ ...blog, banner: url})
                }
                else {
                    toast.error("Error loading the banner");
                }
            })
            .catch(err => console.log(err));
        }
    }
    const handleBannerError = (e) => {
        
        let bannerdef = e.target;
        bannerdef.src = defaultBanner;
    }


    //Title
    const handleTittleKeyDown = (e) => {
        if(e.keyCode == 13) {
            e.preventDefault();
        }
    }
    const handleTittleChange = (e) => {
        let input = e.target;
        input.style.height = 'auto'; 
        input.style.height = input.scrollHeight + "px";
        console.log("blog ANTES del cambio de titulo:", blog.title);
        setBlog( { ...blog, title: input.value});
        console.log("blog DESPUES del cambio de titulo:", blog.title);
    }


    //Publish
    const handlePublishEvent = () => {
        if(!banner.length)
            return toast.error("Upload a blog banner to publish it");

        if(!title.length)
            return toast.error("write blog title to publish it");

        if(textEditor.isReady){

            textEditor.save().then(data => {
                if(data.blocks.length){
                    setBlog({...blog, content: data});
                    setEditorState("publish");
                } else {
                    return toast.error("Write something man...");
                }
            })
            .catch(err => {
                console.log(err);
            })
        }
    }

    const handleSaveDraft = (e) => {
        
        if(e.target.className.includes("disable")) return ;

        //validate data
        if(!title.length)
            return toast.error("write blog title to publish it");

        let loadingToast = toast.loading("Saving draft...");
        e.target.classList.add('disable');
        
        if(textEditor.isReady){
            textEditor.save().then(content => {
                let blogObj = {
                    title, banner, content, des, tags, draft: true
                }
        
                axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", {...blogObj, id: blog_id}, {
                    headers:{
                        'Authorization': `Bearer ${access_token}`
                    }
                }).then( () => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast);
                    toast.success("Draft saved successfuly");
                    setTimeout(() => {
                        navigate("/")
                    }, 500);
                }).catch(({response}) => {
                    e.target.classList.remove('disable');
                    toast.dismiss(loadingToast);
        
        
                    return toast.error(`Error saving draft, please try again. Error: ${response.data.error}`);
                })
            })
        }
    }

    
    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} alt="" />
                </Link>
                <p className="max-md:hidden text-black line-clamp-1">
                    { title ? title : "New Blog" }
                </p>
                <div className="flex gap-4 ml-auto">
                    <button 
                        className="btn-dark py-2"
                        onClick={handlePublishEvent}>
                        Publish
                    </button>
                    <button 
                        className="btn-light py-2"
                        onClick={handleSaveDraft}
                    >
                        Save Draft
                    </button>
                </div>
            </nav>

            <AnimationWrapper>
                <section>
                    <Toaster />
                    <div className="mx-auto max-w-[900px] w-full">
                        <div className="relative aspect-video bg-white border-4 border-grey ">
                            <label htmlFor="uploadBanner">
                                <img
                                    // ref={blogBannerRef} 
                                    src={banner} 
                                    alt="" 
                                    className="z-20"
                                    onError={handleBannerError}
                                />
                                <input
                                    id="uploadBanner" 
                                    type="file" 
                                    accept=".png, .jp, .jpeg"
                                    onChange={handleBannerUpload}
                                    hidden
                                />
                            </label>
                        </div>
                        <textarea
                            defaultValue={title}
                            name="title" 
                            id="title" 
                            placeholder="Blog Tittle" 
                            className="text-4xl font-medium w-full outine-none resize-none mt-10 leading-tight placeholder:opacity-40"
                            onKeyDown={handleTittleKeyDown}
                            onChange={handleTittleChange}
                        ></textarea>

                            <hr className="w-ful opacity-10 my-5"/>

                            <div id="textEditor" className="font-gelassio"></div>
                    </div>
                </section>
            </AnimationWrapper>
        </>
    )

}

export default BlogEditor;