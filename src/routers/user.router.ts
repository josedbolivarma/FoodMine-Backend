import { request, response, Router } from 'express';
import { sample_users } from '../data';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { UserModel, User } from '../models/user.model';
import { HTTP_BAD_REQUEST } from '../constants/http_status';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/seed', asyncHandler(
    async ( req, res ) => {
        const usersCount = await UserModel.countDocuments();
        if ( usersCount > 0 ) {
            res.send('Seed is already done!');
            return;
        }
        
    await UserModel.create( sample_users );
    res.send('Seed Is Done');
    }

));

router.post('/login', asyncHandler(
    async ( req: any = request, res: any = response ) => {
        try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        
        // Verified Password
        
        if( user ) {
            const validPassword = bcrypt.compareSync( password, user.password );
                if ( !validPassword ) {
                   return res.status( HTTP_BAD_REQUEST ).send('User password is not valid!');
                }
            res.send(generateTokenResponse( user ));
        } else {
            res.status( HTTP_BAD_REQUEST ).send('User gmail or password is not valid!');
        }
        } catch (error) {
            
        }
    }
));

router.post('/register', asyncHandler(
    async (req, res) => {
        const { name, email, password, address } = req.body;
        const user = await UserModel.findOne({ email });

        if ( user ) {
            res.status( HTTP_BAD_REQUEST )
            .send('User is already exist, please login');
            return;
        }

        const encryptedPassword = await bcrypt.hash( password, 10 );

        const newUser: User = {
            id: '',
            name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            address,
            isAdmin: false
        }

        const dbUser = await UserModel.create( newUser );

        res.send( generateTokenResponse( dbUser) )
    }
))

const generateTokenResponse = ( user: any ) => {
    const token = jwt.sign({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
    }, 'SomeRandomText', {
        expiresIn: '30d'
    });

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        address: user.address,
        isAdmin: user.isAdmin,
        token: token
    }
}

export default router;