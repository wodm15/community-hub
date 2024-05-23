import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {prisma} from '../utils/prisma/index.js';
const router= express.Router();

//댓글 입력 생성 API (외래키: Users, Posts)
router.post('/posts/:postId/comments', authMiddleware, async (req,res,next)=>{
    try{
        const {userId} = req.user;
        const {postId} = req.params;
        const {content} = req.body;

    const post = await prisma.posts.findFirst({where: {postId: +postId}});
    if (!post){
        return res.status(404).json({errorMessage: "게시글이 존재하지 않습니다."});
    }

    const comment = await prisma.comments.create({
        data:{
            content,
            UserId: +userId,
            PostId: +postId,
        }
    });

    return res.status(201).json({data: comment});
}catch (error){
    next(error)
}
})

//댓글 조회 api
router.get('/posts/:postId/comments',async (req, res, next)=>{
    try{
        const {postId} = req.params;

        const post = await prisma.comments.findFirst({
        where:{
            PostId: +postId,
        }
    });
    if(!post){
        res.status(404).json({errorMessage:"게시글이 존재하지 않습니다."});
    }
    
    const comments =await prisma.comments.findMany({
        where: {
            PostId: +postId,
        },
        orderBy:{
            createdAt: "desc",
        }
    });

    return res.status(200).json({data: comments});
}catch (error){
    next(error);
}
})
export default router;