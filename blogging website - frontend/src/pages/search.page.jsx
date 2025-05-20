import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import NoDataMessage from "../components/nodata.component";
import BlogPostCard from "../components/blog-post.component";
import AnimationWrapper from "../common/page-animation";
import LoadMoreDataBtn from "../components/load-more.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import axios from "axios";
import toast from "react-hot-toast";
import UserCard from "../components/usercard.component";

const SearchPage = () => {
    const serverDomain = import.meta.env.VITE_SERVER_DOMAIN;

    let [latestBlogs, setLatestBlogs] = useState(null); // handle shown blogs
    let [users, setUsers] = useState(null); // handle Users
    
    let { query } = useParams();

    const searchBlogs = ({page = 1, create_new_arr = false}) => {
        let url = serverDomain + "/search-blogs"

        axios.post(url, { query, page })
        .then( async ({data}) => {

            console.log("searchBlog - create_new_array", create_new_arr);

            let formatedData = await filterPaginationData({
                state: latestBlogs,
                results: data.blogs,
                page,
                countRoute: "/search-blogs-count",
                data_to_send: { query },
                create_new_arr
            })
            console.log(formatedData);
            setLatestBlogs(formatedData);

        })
        .catch(err => toast.error(err));
    }

    const fetchUsers = () => {
        let url = serverDomain + "/search-users"

        axios.post(url, {query})
        .then(({data:{users}}) => {
            console.log("users", users);
            setUsers(users);
        })
        .catch (err => {
            toast.error(err);
        })
    }

    useEffect(()=> {
        resetState();
        searchBlogs({page: 1, create_new_arr: true});
        fetchUsers();
    }, [query])
    
    const resetState = () => {
        setLatestBlogs(null);
        setUsers(null);
    }


    const UserCardWrapper = () => {
        return (
            <>
                {
                    users == null ? <Loader /> : 
                        users.length ? users.map((user, i) => {
                            console.log(user.personal_info.username);
                            return (
                                <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                    <UserCard user={user} />
                                </AnimationWrapper>)
                        }) : <NoDataMessage message="None account matched" /> 
                }
            </>
        )
    }

    return (
        <section className="h-cover flex justify-center gap-10">
            <div className="w-full">
                <InPageNavigation routes={[`Search Results from "${query}"`, "Accounts Matched"]} defaultHidden={"Accounts Matched"}>
                    <>
                        {
                            latestBlogs == null ? (<Loader />) :
                            latestBlogs.results && latestBlogs.results.length ? 
                                latestBlogs.results.map((blog, i) => {
                                    return <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                        <BlogPostCard content={blog} author={blog.author.personal_info} />
                                    </AnimationWrapper>
                                }) : <NoDataMessage message={`Any blog matches with "${query}"`}/>
                        }
                        <LoadMoreDataBtn state={latestBlogs} fetchDataFunc={searchBlogs}/>
                    </>
                    <UserCardWrapper></UserCardWrapper>              
                </InPageNavigation>
            </div>

            <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
                    <h1 className="font-medium text-xl mb-8">User Related to search <i className="fi fi-rr-user"></i></h1>
                    <UserCardWrapper></UserCardWrapper>              
            </div>
        </section>
    )
}

export default SearchPage;