// controllers/advertisement.controller.js

const { Advertisement } = require("../models");
const axios = require("axios");

// ===============================
// Upload To BunnyCDN
// ===============================
async function uploadBufferToBunny(
  buffer,
  filename,
  mime = "image/jpeg"
) {
  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_API_KEY;

  if (!storageZone || !apiKey) {
    throw new Error("BunnyCDN config missing");
  }

  const response = await axios.put(
    `https://storage.bunnycdn.com/${storageZone}/${filename}`,
    buffer,
    {
      headers: {
        AccessKey: apiKey,
        "Content-Type": mime,
      },
    }
  );

  if (response.status === 201 || response.status === 200) {
    return `https://${storageZone}.b-cdn.net/${filename}`;
  }

  throw new Error("Upload failed");
}

// ===============================
// Generate File Name
// ===============================
function generateFileName(file) {
  const mimeType = file.mimetype || "image/jpeg";

  const ext = (
    mimeType.split("/")[1] || "jpg"
  ).replace(/[^a-z0-9]/gi, "");

  return `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
}

// ===============================
// Get All Advertisements
// ===============================
exports.getAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: advertisements.length,
      data: advertisements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Active Advertisements
// ===============================
exports.getActiveAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.findAll({
      where: {
        is_active: true,
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: advertisements.length,
      data: advertisements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Get Single Advertisement
// ===============================
exports.getAdvertisementById = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement =
      await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    res.status(200).json({
      success: true,
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Add Advertisement
// ===============================
exports.addAdvertisement = async (req, res) => {
  try {
    const {
      name,
      duration,
      owner,
      price,
      counterClick,
      link,
    } = req.body;

    // validation
    if (
      !name ||
      !duration ||
      !owner ||
      !price ||
      !link
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let image = null;

    if (req.file) {
      image = await uploadBufferToBunny(
        req.file.buffer,
        generateFileName(req.file),
        req.file.mimetype
      );
    }

    const advertisement =
      await Advertisement.create({
        name,
        duration,
        owner,
        price,
        counterClick: counterClick || 0,
        link,
        image,
      });

    res.status(201).json({
      success: true,
      message:
        "Advertisement created successfully",
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Update Advertisement
// ===============================
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement =
      await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    let image = advertisement.image;

    // upload new image
    if (req.file) {
      image = await uploadBufferToBunny(
        req.file.buffer,
        generateFileName(req.file),
        req.file.mimetype
      );
    }

    const {
      name,
      duration,
      owner,
      price,
      counterClick,
      link,
      is_active,
    } = req.body;

    await advertisement.update({
      name:
        name !== undefined
          ? name
          : advertisement.name,

      duration:
        duration !== undefined
          ? duration
          : advertisement.duration,

      owner:
        owner !== undefined
          ? owner
          : advertisement.owner,

      price:
        price !== undefined
          ? price
          : advertisement.price,

      counterClick:
        counterClick !== undefined
          ? counterClick
          : advertisement.counterClick,

      link:
        link !== undefined
          ? link
          : advertisement.link,

      is_active:
        is_active !== undefined
          ? is_active
          : advertisement.is_active,

      image,
    });

    res.status(200).json({
      success: true,
      message:
        "Advertisement updated successfully",
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Activate Advertisement
// ===============================
exports.activeAdvertisement = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const advertisement =
      await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    await advertisement.update({
      is_active: true,
    });

    res.status(200).json({
      success: true,
      message:
        "Advertisement activated successfully",
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Deactivate Advertisement
// ===============================
exports.disActiveAdvertisement = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const advertisement =
      await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    await advertisement.update({
      is_active: false,
    });

    res.status(200).json({
      success: true,
      message:
        "Advertisement deactivated successfully",
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Increase Click Counter
// ===============================
exports.increaseClickCounter = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const advertisement =
      await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    advertisement.counterClick += 1;

    await advertisement.save();

    res.status(200).json({
      success: true,
      message:
        "Counter updated successfully",
      data: advertisement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Delete Advertisement
// ===============================
exports.deleteAdvertisement = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const advertisement =
      await Advertisement.findByPk(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    await advertisement.destroy();

    res.status(200).json({
      success: true,
      message:
        "Advertisement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};