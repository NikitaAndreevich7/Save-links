const { Router } = require('express')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const config = require('config')
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const router = Router()

router.post('/register',
  [
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Минимальная длина пароля 6 символов').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {

      const errors = validationResult(req)

      //Если встроенный метод не пустой, то заходим в if
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при регистрации'
        })
      }

      const { email, password } = req.body
      const candidate = await User.findOne({ email })

      //проверяем есть ли такой пользователь
      if (candidate) {
        return res.status(400).json({ message: 'Такой пользователь уже существует.' })
      }

      //хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 12)

      //создаем нового пользователя
      const user = new User({ email, password: hashedPassword })

      //ждем пока пользователь сохранится
      await user.save()

      res.status(201).json({ message: 'Пользователь создан' })

    } catch (e) {
      res.status(500).json({ message: 'Что то пошло не так' })
    }
  })

router.post('/login',
  [
    check('email', 'Введите корректный email').normalizeEmail().isEmail(),
    check('password', 'введите пароль').exists()
  ],
  async (req, res) => {

    try {

      const errors = validationResult(req)

      //Если встроенный метод не пустой, то заходим в if
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные gпри входе в систему'
        })
      }

      const { email, password } = req.body

      const user = await User.findOne({ email })

      //если нет пользователя
      if (!user) {
        return res.status(400).json({ message: 'Пользователь не найден' })
      }

      //Cравниваем пароль
      const isMatch = await bcrypt.compare(password, user.password)

      //если пароль не совпадает
      if (!isMatch) {
        return res.status(400).json({ message: 'Неверный пароль попробуйте снова' })
      }

      //создаем токен
      const token = jwt.sign(
        { userId: user.id }, //какие данные шифруем
        config.get('jwtSecret'),
        { expiresIn: '1h' } //срок жизни токена
      )

      res.json({ token, userId: user.id })


    } catch (e) {
      res.status(500).json({ message: 'Что то пошло не так' })
    }

  })

module.exports = router