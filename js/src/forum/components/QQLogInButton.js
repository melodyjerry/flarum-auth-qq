import Button from 'flarum/components/Button'

/**
 * The `QQLogInButton` component displays a social login button which will open
 * a popup window containing the specified path.
 *
 * ### Props
 *
 * - `path`
 */
export default class QQLogInButton extends Button {
  init() {
    this.authsQQ = null
    super.init()
  }

  view() {
    this.props.onclick = this.checkH5.bind(this)
    this.props.className = (this.props.className || '') + ' LogInButton'
    return super.view()
  }

  checkH5() {
    if (navigator.userAgent.indexOf('Html5Plus') > -1) {
      this.loading = true
      plus.oauth.getServices(
        services => {
          for (var i in services) {
            if (services[i].id == 'qq') {
              this.authsQQ = services[i]
            }
          }
          this.authLogin()
        },
        e => {
          alert('获取分享服务列表失败：' + e.message + ' - ' + e.code)
        }
      )
    } else {
      const width = 580
      const height = 400
      const $window = $(window)

      window.open(
        app.forum.attribute('baseUrl') + this.props.path,
        'logInPopup',
        `width=${width},` + `height=${height},` + `top=${$window.height() / 2 - height / 2},` + `left=${$window.width() / 2 - width / 2},` + 'status=no,scrollbars=yes,resizable=no'
      )
    }
  }

  authLogin() {
    var s = this.authsQQ
    // if (!s.authResult) {
    s.login(
      e => {
        // 获取登录操作结果
        var result = e.target.authResult
        // alert('登录认证成功：' + JSON.stringify(result))

        this.authUserInfo()
      },
      e => {
        alert('登录认证失败！')
      },
      {}
    )
    // }
  }

  authLogout() {
    for (var i in this.auths) {
      var s = auths[i]
      if (s.authResult) {
        s.logout(
          function(e) {
            alert('注销登录认证成功！')
          },
          function(e) {
            alert('注销登录认证失败！')
          }
        )
      }
    }
  }
  // 获取登录用户信息操作
  authUserInfo() {
    var s = this.authsQQ
    if (!s.authResult) {
      alert('未登录授权！')
    } else {
      s.getUserInfo(
        e => {
          // alert('获取用户信息成功：' + JSON.stringify(s.userInfo))
          var pload = {
            openid: s.authResult.openid,
            access_token: s.authResult.access_token,
            pay_token: s.authResult.pay_token,
            nickname: s.userInfo.nickname,
            figureurl_qq_2: s.userInfo.figureurl_qq_2
          }
          //拿到用户信息，进行相关处理，ajax传用户数据到服务器等
          var prame = escape(JSON.stringify(pload))

          m.request({
            method: 'GET',
            url: '/api/authh5/qq?param=' + prame,
            deserialize: function(value) {
              return value
            }
          })
            .then(result => {
              result = result.replace('window.close();', '')
              result = result.replace('.opener', '')
              result = result.replace('<script>', '')
              result = result.replace(';</script>', '')
              eval(result)
            })
            .catch(err => {
              console.log(err)
            })

          // app
          //   .request({
          //     url: '/api/authh5/qq?param=' + prame,
          //     method: 'GET'
          //   })
          //   .then(res => {
          //
          //     // m.mount(document.body, res)
          //   })
        },
        e => {
          alert('获取用户信息失败：' + e.message + ' - ' + e.code)
        }
      )
    }
  }
}
