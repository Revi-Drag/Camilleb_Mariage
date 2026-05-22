<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\RememberMeBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;

class JsonLoginAuthenticator extends AbstractAuthenticator
{
    public function supports(Request $request): ?bool
    {
        return $request->isMethod('POST')
            && $request->getPathInfo() === '/api/login';
    }

    public function authenticate(Request $request): Passport
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new AuthenticationException('Requête JSON invalide.');
        }

        $email = trim((string) ($data['email'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($email === '' || $password === '') {
            throw new AuthenticationException('Email et mot de passe obligatoires.');
        }

        return new Passport(
            new UserBadge($email),
            new PasswordCredentials($password),
            [
                new RememberMeBadge(),
            ]
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Utilisateur invalide.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $roles = $user->getRoles();

        return new JsonResponse([
            'success' => true,
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $roles,
            ],
            'redirect' => $this->getRedirectPath($roles),
        ]);
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'success' => false,
            'error' => 'Identifiants invalides.',
        ], Response::HTTP_UNAUTHORIZED);
    }

    private function getRedirectPath(array $roles): string
    {
        if (in_array('ROLE_ADMIN', $roles, true)) {
            return '/app/admin-dashboard.html';
        }

        if (in_array('ROLE_CLIENT', $roles, true)) {
            return '/app/client-dashboard.html';
        }

        return '/app/';
    }
}