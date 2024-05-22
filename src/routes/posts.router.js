import express from 'express';
import {prisma} from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/posts',authMiddleware,async(req,res,next)=>{
    const {userId} = req.user;

    const {title,content} = req.body;

    const post = await prisma.posts.create({
        data: {
            UserId: userId,
            title,
            content,
        },
    })
    return res.status(201).json({data: post});
});

//전체 posts 글 보기
router.get('/posts',async (req,res,next)=>{
    const posts = await prisma.posts.findMany({
        select: {
            postId: true,
            title: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        }
    })
    return res.status(200).json({data: posts});
})


//posts 글 중 id 같은 것만 보기
router.get('/posts/:postId',async(req,res,next)=>{
    const {postId} = req.params;
    const post = await prisma.posts.findFirst({
        where: {postId: +postId},
        select:{
            postId: true,
            title: true,
            createdAt: true,
            updatedAt: true,
        }
    })
    return res.status(200).json({data: post});
})

export default router;