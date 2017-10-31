# kefu-mini-program-sdk

## sdk 说明

- sdk 没有 UI，需要自己编写
- 目前仅提供基本的消息收发功能，一些高级功能暂不支持
- API 可以参考 `api-doc.md` 但是还是以 demo 为准

## demo 使用方法

1. 下载本项目并使用最新版 `微信开发者工具` 打开
1. 打开 console 控制台
1. 编译运行

## 注意事项

- 实际使用时 在微信中发请求需要事先设置允许请求的域名，需要设置以下域名：
	- `kefu.easemob.com` 客服后台
	- `kefucross.easemob.com` 用于跨域请求的代理服务
	- `a1.easemob.com` restServer，按照实际情况填写，可能会因所在集群而不同
	- `im-api.easemob.com` xmppServer，按照实际情况填写，可能会因所在集群而不同

- 关于收发表情
  - 由于涉及 UI 渲染，在 sdk 层无法提供
  - 收到消息时请根据 KefuWebIM.sdkConst.EMOJI_MAP 这个映射自行解析
  - 发送时直接发送字符即可，例如：`[):]` 代表笑脸