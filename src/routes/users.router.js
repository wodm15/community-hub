import express from 'express'
import bcrypt from 'bcrypt';
import {prisma} from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';


const router = express.Router();

//사용자 회원가입 api
router.post('/sign-up', async(req,res,next)=>{
    try{
    const {email, password, name, age, gender, profileImage} =req.body;

    //동일 이메일 확인
    const isExistUser = await prisma.users.findFirst({
        where: {email},
    });
    if(isExistUser){
        return res.status(409).json({message: "이미 존재하는 이메일입니다."});
    }
    //솔트 뿌리기
    const hashedPassword = await bcrypt.hash(password, 10);
    //회원가입 user 스키마에 생성
    const user = await prisma.users.create({
        data: {
            email, 
            password: hashedPassword,
        }
    })
    //회원가입 userInfo 스키마에 생성
    const userInfo = await prisma.userInfos.create({
        data: {
            UserId: user.userId,
            name: name,
            age: age,
            gender: gender.toUpperCase(),
            profileImage,
        }
    })

    return res.status(201).json({message: "회원가입이 완료되었습니다."});
}catch (err){
    next(err);
}
});

    //로그인 api
    router.post('/sign-in', async (req, res, next)=>{
        const {email, password} = req.body;
        //동일 이메일 확인
        const user = await prisma.users.findFirst({where: {email}});
        if(!user){
            return res.status(401).json({message:"이메일이 존재하지 않습니다."});
        }
        //비밀번호 확인
        if(!await bcrypt.compare(password, user.password)){
            return res.status(401).json({message:"비밀번호가 올바르지 않습니다."});
        }

        //로그인 성공 시 사용자에게 jwt 발급
        const token = jwt.sign(
        {
            userId: user.userId,
        },
        'scret_key',            //나중에 꼭 dotenv 이용해서 하기
    )
    res.cookie('autorization',`Bearer ${token}`);  
    return res.status(201).json({message:"로그인 성공"});
    });

    // src/routes/users.route.js

/** 사용자 조회 API **/
router.get('/users', authMiddleware, async (req, res, next) => {
    const { userId } = req.user;
    console.log(userId);
    const user = await prisma.users.findFirst({
      where: { userId: +userId },
      select: {
        userId: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        UserInfos: {
          // 1:1 관계를 맺고있는 UserInfos 테이블을 조회합니다.
          select: {
            name: true,
            age: true,
            gender: true,
            profileImage: true,
          },
        },
      },
    });
  
    return res.status(200).json({ data: user });
  });


export default router;