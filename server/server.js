import express, { json } from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import User from "./Schema/User.js"
import Blog from "./Schema/Blog.js"
import Notification from "./Schema/Notification.js"
import Comment from "./Schema/Comment.js"
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import ServiceAccountKey from "./blog-website-p-2949f3ce5c89.json" with {type: "json"};
import {getAuth} from "firebase-admin/auth"
import aws from "aws-sdk";


// INIT:

// var
const server = express();
let PORT = 3000;
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

// config:
admin.initializeApp({
    credential:admin.credential.cert(ServiceAccountKey)
})
server.use(express.json());
server.use(cors());
//mongo
mongoose.connect(process.env.DB_LOCATION, {autoIndex: true})

//amazon
const s3 = new aws.S3({
    region:'eu-south-2',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY

})



//methods:
const generateUploadURL = async () => {

    // // console.log("generateUploadURL");
    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;
    // // console.log("generateUploadURL - afeter s3 call");
    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'blog-personal-esp',
        Key: imageName,
        Expires:10000,
        ContentType: "iamge/jpeg"
    });
}

const generateUsername = async(email) => {
    let username = email.split("@")[0];

    let isUSernameUnique = await User.exists({"personal_info.username": username}).then( (result) => result)

    return isUSernameUnique ? "" : username += nanoid().substring(0, 5); 
}

const formatDatatoSend = (user) => {

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)
    // console.log("user:", user);
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    }
}

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) {
        return res.status(401).json({error: "No access token"})
    }
    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if (err){
            return res.status(403).json({error: "Invalid token"});
        }
        req.user = user.id;
        next();
    })
}


//URLS
server.get('/get-upload-url', (req, res) => {
    // console.log("get upload url init")
    generateUploadURL().then( url => {
        // console.log(url);
        res.status(200).json({"uploadURL": url});
    }).catch(err => {
        // console.log(err.message);
        return res.status(500).json({"error": err.message});
    });
});

//AUTH
server.post("/signup", (req, res) => {

    let { fullname, email, password } = req.body;
    
    // validate data
    if(fullname.length < 3) {return res.status(403).json({"error": "fullname must be at least 3 letter long"})}
    if(!email.length) {return res.status(403).json({"error": "Enter Email"})}
    if(!emailRegex.test(email)) { return res.status(403).json({"error": "Invalid email format"}) }
    if(!passwordRegex.test(password)) { return res.status(403).json({"error": "Invalid password"}) }

    // console.log("validations ok");
     bcrypt.hash(password, 10, async (err, hashed_passowrd) => {
        let username = await generateUsername(email)

        let user = new User({
            personal_info: { fullname, email, password: hashed_passowrd, username }
        })
        // console.log("after user.save");
        user.save().then((u) => {
            return res.status(200).json(formatDatatoSend(u))
        }).catch( err => {
            if(err.code == 11000){
                return res.status(500).json({ "error": err.message })
            }
        })
    })
})
server.post("/signin", (req, res) => {
    let {email, password} = req.body;

    User.findOne({ "personal_info.email": email }).then((user) => {
        if(!user) return res.status(403).json({"error": "email not found"});
        
        if(user.google_auth) {return res.status(500).json({ "error": "Account was created using google. Try logging in with google"})}
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
            if(err) return res.status(403).json({"error": "email not found"});
            if (!result) {
                return res.status(403).json({ "error": "Incorrect Password" })
            } else {
                return res.status(200).json(formatDatatoSend(user))
            }
        })
    })
    .catch((err) => {
        // console.log("err");
        return res.status(500).json({"error": err.message })
    })
})
server.post("/google-auth", async (req, res) => {

    let { access_token } = req.body;

    getAuth().verifyIdToken(access_token)
    .then(async (decodeUser) => {
        let { email, name, picture } = decodeUser;

        picture = picture.replace("s96-c", "s384-c");

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {

            return u || null
        })
        .catch( (err) => {
            return res.status(500).json({"error": err.message})
        });

        if(user) {
            if(!user.google_auth) {
                return res.status(403).json({"error": "this email was signed up without google. please log in with password toa cces the account" })
                
            }
        } else {
            let username = await generateUsername(email);

            user = new User({
                personal_info: { fullname: name, email, porfile_img: picture, username},
                google_auth: true
            })
            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {return res.status(500).json({ "error": err.message }) })
        }

        return res.status(200).json(formatDatatoSend(user));
    })
    .catch(err => { return res.status(403).json({ "error": err.message})})
})

//BLOGS
server.post("/latest-blogs", (req, res) => {

    let {page} = req.body;
    // console.log(req.body)

    let maxLimit = 5;

    Blog.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip( (page - 1) * maxLimit )
    .limit(maxLimit) //pagination
    .then(blogs => {
        // console.log(blogs);
        return res.status(200).json({blogs})
    })
    .catch(err => {
        // console.log(err);
        return res.status(500).json({"error": err});
    });
})

server.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({draft: false})
    .then(count => {
        return res.status(200).json({totalDocs: count})
    })
    .catch(err => {
        return res.status(400).json({ error: err })
    })
})

server.get("/trending-blogs", (req, res) => {

    let maxLimit = 5;

    Blog.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_reads": -1, "activity.total_likes": -1, "publishedAt": -1})
    .select("blog_id title publishedAt -_id")
    .limit(maxLimit) //pagination
    .then(blogs => {
        // // console.log(blogs);
        return res.status(200).json({blogs})
    })
    .catch(err => {
        // console.log(err);
        return res.status(500).json({"error": err});
    });

    // return res.status(200);
})

server.post("/search-blogs", (req, res) => {

    let { tag, query, author, page, limit, exclude_blog } = req.body;
    let findQuery;

    if (tag){
        findQuery = { tags: tag, draft: false, blog_id: { $ne: exclude_blog }};
    }
    else if(query) {
        findQuery = { title: new RegExp(query, 'i'), draft: false };
    }
    else if (author) {
        findQuery = { author , draft: false}
    }
    let maxLimit = limit ? limit : 5;

    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip( (page - 1) * maxLimit )
    .limit(maxLimit) //pagination
    .then(blogs => {
        // console.log(blogs);
        return res.status(200).json({blogs})
    })
    .catch(err => {
        //// console.log(err);
        return res.status(500).json({"error": err});
    });
})

server.post("/search-blogs-count",  (req, res) => {

    let { tag, author, query } = req.body;
    let findQuery;

    if (tag){
        findQuery = { tags: tag, draft: false };
    }
    else if(query) {
        findQuery = { title: new RegExp(query, 'i'), draft: false };
    }
    else if (author) {
        findQuery = { author , draft: false}
    }


    Blog.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({totalDocs: count})
    })
    .catch(err => {
        return res.status(400).json({ error: err })
    })
})

server.post("/search-users", (req, res) => {
    let {query} = req.body;

    User.find({"personal_info.username": new RegExp(query, 'i')})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then( users => {
        //// console.log(users);
        return res.status(200).json({users});
    })
    .catch(err => {
        return res.status(400).json({error: err});
    })
})

server.post("/get-profile", (req, res) => {
    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updateAt -blogs")
    .then(user => {
        // console.log("then -> user:", user);
        return res.status(200).json(user)
    })
    .catch(err => {
        // console.log(err)
        return res.status(500).json({error: err.message})
    })
})

server.post("/create-blog", verifyJWT, (req, res) => {

    let authorId = req.user;

    let { title, banner, content, tags, des, draft, id} = req.body;
    
    //check data:
    //title
    if(!title)
        return res.status(403).json({error: "You must to provide for a title."})
    if(!draft){
        //des
        if(!des)
            return res.status(403).json({error: "You must to provide for a description to publish de blog."})
        if(des.length > 200)
            return res.status(403).json({error: "The description must be under 200 characters."})

        //Banner
        if(!banner)
            return res.status(403).json({error: "You must to provide for a banner to publish de blog."})

        //content
        if(!content.blocks.length)
            return res.status(403).json({error: "You must to provide for a content to publish de blog."})

        //tags
        if(!tags)
            return res.status(403).json({error: "You must to provide tags to publish de blog."})
        if(tags.length > 10)
            return res.status(403).json({error: "10 tags max"})
        
        tags = tags.map(tag => tag.toLowerCase());
    }
    console.log("");
    console.log("ALL", req.body);
    console.log("");

    let blog_id = id || title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, "-").trim() + nanoid();


    if(id){
        Blog.findOneAndUpdate({ blog_id }, { title, des, banner, content, tags, draft: draft ? draft : false })
        .then( (blog) => {
            console.log("blog cuando tenemos id: ",blog)
            return res.status(200).json({id: blog_id});
        })
        .catch( err => {
            return res.status(500).json({error: err.message})
        })
    } else {
            
        let blog = new Blog({
            title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
        })

        blog.save()
        .then(blog => {
            let incrementVal = draft ? 0 : 1;

            User.findOneAndUpdate({ _id: authorId}, { $inc : {"account_info.total_posts": incrementVal}, $push : {"blogs": blog._id}})
            .then( user => {
                return res.status(200).json({ id: blog.blog_id })
                })
            .catch( err => {
                return res.status(500).json({error: "Failed to update total post number"})
            })
        })
        .catch(err => {
            return res.status(500).json({error: err.message})
        })
    
    }
    
})

server.post("/get-blog", (req, res)=> {
    let { blog_id, draft, mode } = req.body;

    let incrementVal = mode != 'edit' ? 1 : 0;

    Blog.findOneAndUpdate({ blog_id }, { $inc:{ "activity.total_reads":  incrementVal}})
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title banner des content tags activity publishedAt author blog_id")
    .then( blog => {
        //// console.log("blog", blog);
        //Author.findOneAndUpdate({ "personal_info.username": blog.author.personal_info.username }, {$inc : {"account_info.total_reads": incrementVal }})
        
        if(blog.draft && !draft){
            return res.status(500).json({error: "You can not access draft blog."})
        }

        return res.status(200).json(blog);
    })
    .catch(err =>{
        return res.status(500).json({error: err.message})
    })

})

server.post("/like-blog", verifyJWT ,(req, res) => {
    let user_id = req.user;

    let { _id, isLikedByUser } = req.body;

    let incrementVal = !isLikedByUser? 1 : -1;

    Blog.findOneAndUpdate({ _id }, { $inc: { "activity.total_likes": incrementVal } })
    .then(blog => {

        if(!isLikedByUser){
            let like = new Notification({
                type: "like",
                blog: _id,
                notification_for: blog.author,
                user: user_id
            })

            like.save().then( notification => {
                return res.status(200).json({liked_by_user: true});
            })
        } else {

            Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
            .then(data => {
                return res.status(200).json({liked_by_user: false});
            })
            .catch(err => {
                return res.status(500).json({error: err.message});
                
            })

        }
    })


})

server.post("/isliked-by-user", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id } = req.body;

    Notification.exists({ user: user_id, type: "like", blog: _id })
    .then( result => {
        return res.status(200).json({result})
    })
    .catch(err => {
        return res.status(500).json({error: err.message});
    })

})

server.post("/add-comment", verifyJWT, (req, res) => {

    let user_id = req.user;

    let { _id, comment, replying_to, blog_author }  = req.body;

    if(!comment.length){
        return res.status(403).json({ error: "Escribe algo, coño."})
    }

    // creating a comment doc
    let commentObj = new Comment({
        blog_id: _id, blog_author, comment, commented_by: user_id,
    })

    commentObj.save().then(commentFile => {

        let { comment, commentedAt, children } = commentFile;

        Blog.findOneAndUpdate({ _id }, { $push: {"comments": commentFile._id}, $inc: {"activity.total_comments": 1}, "activity.total_parent_comments": 1 })
        .then(blog => { console.log("Comentario creado.")})

        let notificationObj = {
            type: "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentFile._id
        }

        new Notification(notificationObj).save()
        .then(notification => console.log("Notificación creada."));

        return res.status(200).json({
            comment, commentedAt, _id: commentFile._id, user_id, children
        })

    })

})

server.post("/get-blog-comments", (req, res) => {

    let { blog_id, skip } = req.body;

    let maxLimit = 5;

    Comment.find({ blog_id, isReply: false })
    .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
    .skip(skip)
    .limit(maxLimit)
    .sort({
        "commentAt": -1
    })
    .then( comment => {
        return res.status(200).json({comment})
    })
    .catch(err => {
        console.log(err.message)
        return res.status(500).json({error: err.message})
    })
})

// listen( port number, callback function)
server.listen(PORT, () => console.log("Listenng on port -->", PORT))

