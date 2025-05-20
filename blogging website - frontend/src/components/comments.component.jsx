import { useContext } from "react";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import axios from "axios";


const fetchComments = async ( skip = 0, blog_id, setParentCommentCountFun, commentArray = null) => {

    let res;
    let url = import.meta.env.VITE_SERVER_DOMAIN;


    await axios.post(url + "/get-blog-comments", {blog_id, skip})
    .then(({data}) => {

        data.map(comment => {
            comment.childrenLevel = 0;
        })

    })

    return res;

}


const CommentsContainer = () => {

    let { blog: { title },  commentsWrapper, setCommentsWrapper } = useContext(BlogContext);

    return (
        <div className={"max-sm:w-full fixed " + ( commentsWrapper ? "top-0 sm:right-0": "top-[100%] sm:right-[-100%]" ) + " duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-out overflow-x-hidden"}>
            <div className="relative">
                
                <h1 className="text-xl font-medium">Comments</h1>
                <p className="text-lg mt-2 w-[70%] text-dark-grey line-clamp-l">{title}</p>
                <button
                    onClick={ () => setCommentsWrapper(preVal => !preVal) }
                    className="absolute top-0 right-0 flex justify-center items-center w-12 h-12 rounded-full bg-grey">
                    <i className="fi fi-br-cross text-2xl mt-1"></i>
                </button>
            </div>
            <hr  className="border-grey my-8 w-[120%] -ml-10"/>
            <CommentField action="comment" />
        </div>
    )
}

export default CommentsContainer;