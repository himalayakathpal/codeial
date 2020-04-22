const Comment = require('../models/comment');
const Post = require('../models/post');
const commentsMailer = require('../mailers/comments_mailer');
const queue = require('../config/kue');
const commentEmailWorker = require('../workers/comment_email_worker');
const Like = require('../models/like');
module.exports.create= async function (req,res) {
    try{
        let post = await Post.findById(req.body.post);

        if(post){
            let comment = await Comment.create({
                content: req.body.content,
                user: req.user._id,
                post: req.body.post
            });

             post.comments.push(comment);
             post.save();
             comment = await comment.populate('user', 'name email').execPopulate();
             let job = queue.create('emails', comment).save(function(err){
                if (err){
                    console.log('Error in sending to the queue', err);
                    return;
                }
                console.log('job enqueued', job.id);

            })

             if (req.xhr){
                // Similar for comments to fetch the user's id!
                comment = await comment.populate('user', 'name').execPopulate();
    
                return res.status(200).json({
                    data: {
                        comment: comment
                    },
                    message: "Comment created!"
                });
            }
             req.flash('success','Comment added');
             res.redirect('/');
        }
    }catch(err){
        req.flash('error','You cannot delete this post');
        return res.redirect('back');
    }
    
            
}


module.exports.destroy = async function(req,res){
    try{
        let comment = await Comment.findById(req.params.id);
        let post = await Post.findById(comment.post);
        if(comment.user == req.user.id || post.user == req.user.id){
            comment.remove();
            await Post.updateOne(post,{ $pull: {comments: req.params.id}});
            await Like.deleteMany({likeable: comment._id, onModel: 'Comment'});
            // send the comment id which was deleted back to the views
            if (req.xhr){
                return res.status(200).json({
                    data: {
                        comment_id: req.params.id
                    },
                    message: "Comment deleted"
                });
            }
            req.flash('success','Comment deleted');
        }  
        res.redirect('back');
    }catch(err){
        req.flash('error','You cannot delete this post');
        return res.redirect('back');
    }
 
}