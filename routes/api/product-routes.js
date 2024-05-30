const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

/*     /api/products     */

// Get all products
router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get one product
router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { product_name, price, stock, category_id, tags } = req.body;

    const product = await Product.create({
      product_name,
      price,
      stock,
      category_id
    });

    if (tags && tags.length) {
      const productTagIdArr = tags.map(tag => ({
        product_id: product.id,
        tag_id: tag.id
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }

    const productWithTags = await Product.findByPk(product.id, {
      include: [{ model: Tag }]
    });

    res.status(200).json(productWithTags);
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});


// Update product
router.put('/:id', async (req, res) => {
  try {
    const { product_name, price, stock, category_id, tags } = req.body;

    await Product.update(
      { product_name, price, stock, category_id },
      { where: { id: req.params.id } }
    );

    const existingProductTags = await ProductTag.findAll({
      where: { product_id: req.params.id }
    });

    const existingTagIds = existingProductTags.map(({ tag_id }) => tag_id);

    const newTagIds = tags.map(tag => tag.id);

    const tagsToRemove = existingTagIds.filter(tagId => !newTagIds.includes(tagId));
    const tagsToAdd = newTagIds.filter(tagId => !existingTagIds.includes(tagId)).map(tagId => ({
      product_id: req.params.id,
      tag_id: tagId
    }));

    await Promise.all([
      ProductTag.destroy({ where: { product_id: req.params.id, tag_id: tagsToRemove } }),
      ProductTag.bulkCreate(tagsToAdd)
    ]);

    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [{ model: Tag }]
    });

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;