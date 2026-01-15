<?php

namespace App\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

class AuthService
{
    public function __construct(
        private UserRepository $userRepository,
        private RefreshTokenRepository $refreshTokenRepository,
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private JWTTokenManagerInterface $jwtManager
    ) {
    }

    public function register(string $name, string $email, string $plainPassword): User
    {
        // Check if user already exists
        $existingUser = $this->userRepository->findOneBy(['email' => $email]);
        if ($existingUser) {
            throw new \RuntimeException('User with this email already exists');
        }

        $user = new User();
        $user->setName($name);
        $user->setEmail($email);
        $hashedPassword = $this->passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashedPassword);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function login(string $email, string $plainPassword): array
    {
        $user = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            throw new AuthenticationException('User not found');
        }

        if (!$user->isActive()) {
            throw new AuthenticationException('User is not active');
        }

        if (!$this->passwordHasher->isPasswordValid($user, $plainPassword)) {
            throw new AuthenticationException('Invalid password');
        }

        // Generate JWT token
        $token = $this->jwtManager->create($user);

        // Generate refresh token
        $refreshToken = $this->generateRefreshToken($user);

        return [
            'token' => $token,
            'refresh_token' => $refreshToken->getRefreshToken(),
            'user' => $user,
        ];
    }

    public function refreshAccessToken(string $refreshTokenString): array
    {
        $refreshToken = $this->refreshTokenRepository->findValidToken($refreshTokenString);

        if (!$refreshToken) {
            throw new AuthenticationException('Invalid refresh token');
        }

        $user = $refreshToken->getUser();
        if (!$user || !$user->isActive()) {
            throw new AuthenticationException('User is not active');
        }

        // Generate new JWT token
        $token = $this->jwtManager->create($user);

        return [
            'token' => $token,
            'refresh_token' => $refreshTokenString, // Keep same refresh token
            'user' => $user,
        ];
    }

    public function logout(string $refreshTokenString): void
    {
        $refreshToken = $this->refreshTokenRepository->findValidToken($refreshTokenString);
        if ($refreshToken) {
            $this->entityManager->remove($refreshToken);
            $this->entityManager->flush();
        }
    }

    private function generateRefreshToken(User $user): RefreshToken
    {
        // Remove old refresh tokens for this user
        $oldTokens = $this->refreshTokenRepository->findBy(['user' => $user]);
        foreach ($oldTokens as $oldToken) {
            $this->entityManager->remove($oldToken);
        }

        $refreshToken = new RefreshToken();
        $refreshToken->setUser($user);
        $refreshToken->setRefreshToken(bin2hex(random_bytes(32)));
        $refreshToken->setExpiresAt(new \DateTime('+30 days'));

        $this->entityManager->persist($refreshToken);
        $this->entityManager->flush();

        return $refreshToken;
    }
}

