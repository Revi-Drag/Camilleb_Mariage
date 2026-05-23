<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class ClientController extends AbstractController
{
    #[Route('/client', name: 'app_client')]
    #[IsGranted('ROLE_CLIENT')]
    public function index(): Response
    {
        return new Response('<h1>Bienvenue dans l\'espace client</h1>');
    }
}