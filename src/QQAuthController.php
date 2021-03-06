<?php
namespace Hehongyuanlove\AuthQQ;

use Exception;
use Flarum\Forum\Auth\Registration;
use Flarum\Forum\Auth\ResponseFactory;
use Flarum\Http\UrlGenerator;
use Flarum\Settings\SettingsRepositoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface;
use Zend\Diactoros\Response\RedirectResponse;
use Illuminate\Support\Str;

class QQAuthController implements RequestHandlerInterface {
    /**
     * @var ResponseFactory
     */
    protected $response;

    /**
     * @var SettingsRepositoryInterface
     */
    protected $settings;

    /**
     * @var UrlGenerator
     */
    protected $url;

    /**
     * @param ResponseFactory $response
     * @param SettingsRepositoryInterface $settings
     * @param UrlGenerator $url
     */
    public function __construct(ResponseFactory $response, SettingsRepositoryInterface $settings, UrlGenerator $url){
        $this->response = $response;
        $this->settings = $settings;
        $this->url      = $url;
    }


    /**
     * @param Request $request
     * @return ResponseInterface
     * @throws Exception
     */
    public function handle(Request  $request): ResponseInterface {
        $redirectUri = 'https:'.$this->url->to('forum')->route('auth.qq');
        
        $provider   = new QQ([
            'clientId'          => $this->settings->get('hehongyuanlove-auth-qq.client_id'),
            'clientSecret'      => $this->settings->get('hehongyuanlove-auth-qq.client_secret'),
            'redirectUri'       => $redirectUri,
        ]);
      
        $session        = $request->getAttribute('session');
        $queryParams    = $request->getQueryParams();
        $code           = array_get($queryParams, 'code');

        if (!$code) {
            $authUrl    = $provider->getAuthorizationUrl();
            $session->put('oauth2state', $provider->getState());
            return new RedirectResponse($authUrl);
        }
        $state          = array_get($queryParams, 'state');
        
        
        if (!$state || $state !== $session->get('oauth2state')) {
            $session->remove('oauth2state');
            throw new Exception('Invalid state');
        }
        $token          = $provider->getAccessToken('authorization_code', [
            "code"  => $code,
        ]);
      
        $user           = $provider->fetchOpenid($token);
     
        $userinfo = $provider->fetchUesrInfo($token,$user['openid']);
       
		$userinforesult = array_merge_recursive($user, $userinfo); 
        return $this->response->make(
            'QQ', $userinforesult["openid"],
            function (Registration $registration) use ($userinforesult) {
                $registration
                    ->suggestEmail("")
                    ->provideAvatar($userinforesult['figureurl_qq_2'])
                    ->suggestUsername($userinforesult["nickname"].str::upper(str::random(4)))
                    ->setPayload($userinforesult);
            }
        );
    }
}

