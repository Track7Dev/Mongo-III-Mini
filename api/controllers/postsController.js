const mongoose = require("mongoose");

const Post = require("../models/post");
const Comment = require("../models/comment");

const STATUS_USER_ERROR = 422;
const STATUS_SERVER_ERROR = 500;

/* Fill in each of the below controller methods */
const createPost = (req, res) => {
  const { title, text } = req.body;
  const newPost = new Post({ title, text });
  newPost.save((err, post) => {
   return err ? res.status(STATUS_SERVER_ERROR).json(err) : res.json(post);
  });
};

const listPosts = (req, res) => {
  Post.find()
    .populate("comments")
    .exec((err, posts) => {
      return err ? res.status(STATUS_SERVER_ERROR).json(err) : res.json(posts);
    });
};

const findPost = (req, res) => {
  const { id } = req.params;
  Post.findById(id)
    .populate("comments")
    .exec()
    .then((err, post) => {
      return err ? res.status(STATUS_USER_ERROR).json(err) : res.json(post);
    });
};

const addComment = async (req, res) => {
  const { id } = req.params;
  const commentBody = {
    _parent: id,
    text: req.body.text
  };
  const comment = new Comment({ _parent: id, text: req.body.text });
  Post.findOneAndUpdate(
    id,
    { $push: { comments: await comment._id }, new: true },
    (err, post) => {
      return err ? res.status(STATUS_USER_ERROR).json(err) : res.json(post);
    }
  );
};

// In this function, we need to delete the comment document
// We also need to delete the comment's parent post's reference
// to the comment we just deleted
const deleteComment = (req, res) => {
  const { commentId, id } = req.params;
  Comment.findByIdAndRemove(commentId, (err, result) => {
  if (err) return res.status(STATUS_USER_ERROR).json(err) ;
    Post.findByIdAndUpdate(
      id,
      { $pull: { comment: commentId } },
      { safe: true, upsert: true, new: true },
      (updateErr, post) => {
        return updateErr ? res.status(STATUS_USER_ERROR).json(err) : res.json(post);
      }
    );
  });
};

// Similarly, in this function we need to delete the post document,
// along with any comments that are the children of this post
// We don't want any orphaned children in our database
const deletePost = (req, res) => {
  const { id } = req.params;
  Post.findByIdAndRemove(id, (err, post) => {
    if (err) return res.status(STATUS_SERVER_ERROR).json(err);
    Comment.remove({ _parent: id }, (commentErr, response) => {
      return commentErr ? res.status(STATUS_SERVER_ERROR).json(err) : res.json(post);
    });
  });
};

module.exports = {
  createPost,
  listPosts,
  findPost,
  addComment,
  deleteComment,
  deletePost
};