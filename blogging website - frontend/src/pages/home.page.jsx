import { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import axios from "axios";
import toast from "react-hot-toast";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/minimal-blog-post.component";
import { activeTabLineRef, activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";


const HomePage = () => {

    let [latestBlogs, setLatestBlogs] = useState(null); // handle shown blogs
    let [trendingBlogs, setTrendingBlogs] = useState(null); 
    let [pageState, setPageState] = useState("home"); // handle Topics/Tags

    let categories = ["reflexión", "fantasia", "grimdark", "test", "filosofía", "joe Abercrombie"];

    const fetchLatestBlogs = ({ page = 1 }) => {

        let url = import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs"

        axios.post(url, {page})
        .then( async ({data}) => {

            console.log("fetchLatestBlogs: ", data.blogs);
            let formatedData = await filterPaginationData({
                state: latestBlogs,
                results: data.blogs,
                page,
                countRoute: "/all-latest-blogs-count"
            })
            console.log(formatedData);
            setLatestBlogs(formatedData);

        })
        .catch(err => toast.error(err));
    }

    const fetchTrendingBlogs = () => {
        let url = import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs"

        axios.get(url).then(({ data }) => {
            setTrendingBlogs(data.blogs);
        }).catch(err => toast.error(err));
    }

    const fetchBlogsByCategory = ({page = 1}) => {

        let url = import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs"

        console.log("fetchBlogsByCategory - pageState: ", pageState);

        axios.post(url, { tag: pageState, page })
        .then( async ({ data }) => {
            console.log("fetchBlogsByCategory: ", data.blogs);
            let formatedData = await filterPaginationData({
                state: latestBlogs,
                results: data.blogs,
                page,
                countRoute: "/search-blogs-count",
                data_to_send: { tag: pageState },
            })
            console.log(formatedData);
            setLatestBlogs(formatedData);

        }).catch(err => toast.error(err));
    }

    const filterBlogByTag = (e) => {
        let tagSelecteed = e.target.innerText.toLowerCase();
        setLatestBlogs(null);
        
        if(pageState == tagSelecteed){
            setPageState("home");
            fetchLatestBlogs({page: 1});
            return ;
        }
        setPageState(tagSelecteed);
        fetchBlogsByCategory({page: 1});
    }

    useEffect(() => {

        activeTabRef.current.click();

        if (pageState=="home"){
            fetchLatestBlogs({page: 1})
        } else {
            fetchBlogsByCategory({page: 1})
        }

        if(!trendingBlogs){
            fetchTrendingBlogs();
        }
    }, [pageState])

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                <div className="w-full">
                    <InPageNavigation routes={[pageState, "trending"]} defaultHidden={["trending"]}>

                        <>
                            {
                                latestBlogs == null ? (<Loader />) :
                                latestBlogs.results && latestBlogs.results.length ? 
                                    latestBlogs.results.map((blog, i) => {
                                        return <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info} />
                                        </AnimationWrapper>
                                    }) : <NoDataMessage message={`Any blog matches with "${pageState}"`}/>
                            }
                            <LoadMoreDataBtn state={latestBlogs} fetchDataFunc={pageState == "home" ? fetchLatestBlogs : fetchBlogsByCategory}/>
                        </>
                        {
                            trendingBlogs == null ? <Loader /> :
                                trendingBlogs.map((blog, i) => {
                                    return <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                        <MinimalBlogPost blog={blog} index={i} />
                                    </AnimationWrapper>
                                })
                        }
                    </InPageNavigation>
                </div>

                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories</h1>

                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return (
                                            <button className={"tag " + (pageState == category ? " bg-black text-white": "")} key={i} onClick={filterBlogByTag}>{category}</button>
                                        )
                                    })
                                }
                            </div>
                        </div>
                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending <i className="fi fi-rr-arrow-trend-up"></i></h1>

                            {
                                trendingBlogs == null ? <Loader /> :
                                    trendingBlogs.map((blog, i) => {
                                        return <AnimationWrapper transition={{ duration: 1, delay: i * .1 }} key={i}>
                                            <MinimalBlogPost blog={blog} index={i} />
                                        </AnimationWrapper>
                                    })
                            }
                        </div>
                    </div>
                </div>
            </section>

        </AnimationWrapper>
    )

}


export default HomePage