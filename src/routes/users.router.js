import express from 'express'
import bcrypt from 'bcrypt';
import {prisma} from '../utils/prisma/index.js';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';


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

    //user + userInfo 트랜잭션 구현
    const [user, userInfo] = await prisma.$transaction(async (tx)=>{

    //회원가입 user 스키마에 생성
    const user = await tx.users.create({
        data: {
            email, 
            password: hashedPassword,
        }
    })
    //회원가입 userInfo 스키마에 생성
    const userInfo = await tx.userInfos.create({
        data: {
            UserId: user.userId,
            name: name,
            age: age,
            gender: gender.toUpperCase(),
            profileImage,
        }
    })
    return [user, userInfo];
}, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
});

    return res.status(201).json({message: "회원가입이 완료되었습니다."});
}catch (err){
    next(err);
}
});

//사용자 정보 수정 api (+ histoies 트랜잭션 추가)
router.patch('/users',authMiddleware, async(req, res, next)=>{
    const {userId} = req.user;
    const updatedData = req.body;   //여기에 {name, age, gender, profileImage}가 들어감
    //수정되기 전 사용자 정보 데이터 조회하기
    const userInfo = await prisma.userInfos.findFirst({
        where: {UserId : +userId},
    });

    //사용자 update 와 histories 같이 묶어서 트랜잭션
    await prisma.$transaction(async (tx)=>{
        await tx.userInfos.update({
            data: {
                ...updatedData //updateData 풀기 
            },
            where: { UserId : +userId},
        });

        for (let key in updatedData){
            //만약 변경된 데이터가 있을 경우
            //   UserHistoryId String @id @default(uuid()) @map("UserHistoryId")
            //   UserId Int @map("UserId") // 외래키
            //   changeField String @map("changeField")  //변경된 필드명
            //   oldValue      String?  @map("oldValue") // 변경 전 값
            //   newValue      String   @map("newValue") // 변경 후 값
            //   changedAt     DateTime @default(now()) @map("changedAt")
            if(userInfo[key] !== updatedData[key]){
                await tx.userHistories.create({
                    data: {
                        UserId: +userId,
                        changeField: key,
                        oldValue: String(userInfo[key]), //int 가 올경우도 있음
                        newValue: String(updatedData[key]),
                    }
                });
            }
        }
    },{isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,})

    return res.status(201).json({message: "사용자 정보가 변경되었습니다."});
})





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