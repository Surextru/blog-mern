import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Link } from "react-router-dom"
import { getDay } from "../common/date";
import BlogInteraction from "../components/blog-interaction.component";
import { createContext } from "react";
import BlogPostCard from "../components/blog-post.component";
import BlogContent from "../components/blog-content.component";
import CommentsContainer from "../components/comments.component";


export const blogStructure = {
    title: ' ',
    banner: ' ',
    content: {},
    tags: [],
    des: '',
    activity:{},
    author: {personal_info: { }},
    publishedAt: ' ',
}

export const BlogContext = createContext({});

const BlogPage = () => {
    let { blog_id } = useParams( );

    const [blog, setBlog] = useState(blogStructure);
    const [similarBlogs, setSimilarBlogs] = useState(null);
    const [loading, setLoading] = useState();
    const [ isLikedByUser, setIsLikedByUser] = useState(false);
    const [ commentsWrapper, setCommentsWrapper ] = useState(false);
    const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);

    let { title, banner, content, tags, des, activity, publishedAt, author : { personal_info: { fullname, username: author_username, profile_img} }} = blog;

    const fetchBlog = () => {
        let url = import.meta.env.VITE_SERVER_DOMAIN 
        
        axios.post(url + "/get-blog", {blog_id})
        .then(( {data} ) => {
            //data -> blog

            console.log(data.content[0].blocks);

            setBlog(data);

            console.log(data);

            axios.post(url + "/search-blogs", { tag: data.tags[0], limit: 6, exclude_blog: blog_id})
            .then(({ data }) => {
                setSimilarBlogs(data.blogs);
                console.log(data.blogs);
            })
            setLoading(false);
        })
        .catch(err => {
            console.log("err", err);
        })
    }

    useEffect(()=>{
        resetStates();
        fetchBlog();
    }, [blog_id])

    const resetStates = () => {
        setBlog(blogStructure);
        setSimilarBlogs(null);
        setLoading(true);
        setIsLikedByUser(false);
        setCommentsWrapper(false);
        setTotalParentCommentsLoaded(0);
    }

    return (
        <AnimationWrapper>
            {
                loading ? <Loader /> :
                <BlogContext.Provider value={{ blog, setBlog, isLikedByUser, setIsLikedByUser, commentsWrapper, setCommentsWrapper, totalParentCommentsLoaded, setTotalParentCommentsLoaded  }}>
                    
                    <CommentsContainer />

                    <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
                        <img src={banner} className="aspect-video" alt="" />
                        <div className="mt-12">
                            <h1>{title}</h1>
                            <div className="flex max-sm:flex-col justify-between my-8">
                                <div className="flex gap-5 items-start">
                                    <img className="w-12 h-12 rounded-full"  src={profile_img} alt="" />
                                    <p className="capitalize">
                                        {fullname}
                                        <br />
                                        @<Link to={`/user/${author_username}`} className="underline">{author_username}</Link>
                                    </p>
                                </div>
                                <p>
                                    Published on {getDay(publishedAt)}
                                </p>
                            </div>
                        </div>

                        <BlogInteraction />

                            <div className="my-12 font-gelasio blog-page-content">
                            {
                                    blog && blog.content[0] ? content[0].blocks.map((block, i) => {
                                        return <div key={i} className="my-4 md:my-8">

                                            <BlogContent block={block} />

                                        </div>
                                    }) : "No content"
                                } 
                            </div>

                        <BlogInteraction />

                        {
                            similarBlogs != null && similarBlogs.length ?
                            <>
                                <h1 className="text-2xl mt-14 mb-10 font-medium">
                                    Similar Blogs
                                </h1>

                                {
                                    similarBlogs.map((blog, i) => {
                                        let {author: {personal_info}} = blog;

                                        return <AnimationWrapper key={i} transition={{duration: 1, delay: i*0.08 }}>
                                            <BlogPostCard content={blog} author={personal_info} />
                                        </AnimationWrapper>
                                    })
                                }

                            </> : " "
                        }

                    </div>

                </BlogContext.Provider>
            }
            
        </AnimationWrapper>
    )

}

export default BlogPage;