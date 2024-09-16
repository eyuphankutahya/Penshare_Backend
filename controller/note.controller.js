const Note = require("../models/note.model.js");
const User = require("../models/user.model.js");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

exports.createNote = async (req, res) => {
  console.log("Request body:", req.body);
  console.log("Request files:", req.files);

  try {
    const { ders, author,name,surname } = req.body;

    if (!req.files || !req.files.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "No file uploaded" });
    }

    const file = req.files.file;
    console.log("File:",file);
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      use_filename: true,
      folder: "PenShare"
    });

    const note = new Note({
      author,
      ders,
      url: result.secure_url,
      image_id: result.public_id,
      onay: false,
      title: req.body.title,
      görüntülenme: 0,
      type:file.mimetype,
      name,
      surname
    });

    const json = await note.save();

    const user = await User.findById(author);
    if (user) {
      user.notes.push(json._id);
      await user.save();
    }

    fs.unlinkSync(file.tempFilePath);

    res.status(StatusCodes.CREATED).json({ data: json, message: "Not yayınlama işlemi başarılı" });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Not yayınlama işlemi başarısız" });
  }
};

exports.getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find();//indirme sayısını populate etmek gerekecek 
    res.json({ data: notes }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Notlar getirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);//indirme sayısını populate etmek gerekecek 
    res.json({ data: note }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Not getirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

exports.getNotesByAuthor = async (req, res) => {
  try {
    const { author } = req.params;
    const notes = await Note.find({ author });
    res.json({ data: notes }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Notlar getirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

exports.getNotesByClass = async (req, res) => {
  try {
    const { sınıf } = req.params;
    const notes = await Note.find({ sınıf });
    res.json({ data: notes }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Notlar getirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

exports.getNotesByLesson = async (req, res) => {
  try {
    const { ders } = req.query;
    console.log(ders);
    const notes = await Note.find({ ders });
    console.log(notes);
    res.status(StatusCodes.OK).json({ data: notes });
  } catch (error) {
    console.error("Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Notlar getirilemedi" });
  }
};


exports.MyNotes = async (req, res) => {
  const { userID } = req.query;
  console.log("userID:", userID)
  try {
    const notes = await Note.find({ author: userID });
    res.json({ data: notes }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Notlar getirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

exports.NoteDownload = async (req, res) => {

  try {
    const { id } = req.body;
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Geçersiz ID" });
    }
    const note = await Note.findByIdAndUpdate(
      id,
      { $inc: { görüntülenme: 1 } },
      { new: true }
    );
    await note.save();
    res.json({ data: note }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Not indirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

exports.deleteNoteById = async (req, res) => {
  try {
    const { id } = req.body;
    const note = await Note.findByIdAndDelete(id);
    if (note) {
      await cloudinary.uploader.destroy(note.image_id);
      res.json({ data: note }).status(StatusCodes.OK);
    } else {
      res.json({ message: "Not silinemedi" }).status(StatusCodes.NOT_FOUND);
    }
  } catch (error) {
    res
      .json({ message: "Not silinemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

exports.OnayNote = async function (req, res) {

  try {
    const { id } = req.body;
    const note = await Note
      .findByIdAndUpdate(id, { onay: true }, { new: true });
    if (note) {
      res.json({ data: note }).status(StatusCodes.OK);
    }
    else {
      res.json({ message: "Not onaylanamadı" }).status(StatusCodes.NOT_FOUND);
    }
  }
  catch (error) {
    res.json({ message: "Not onaylanamadı" }).status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
exports.MyFalseNote = async (req, res) => {
  try {
    const notes = await Note.find({onay: false });
    res.json({ data: notes }).status(StatusCodes.OK);
  } catch (error) {
    res
      .json({ message: "Notlar getirilemedi" })
      .status(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
 