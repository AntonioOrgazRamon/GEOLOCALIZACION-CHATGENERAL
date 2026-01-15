<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class LocationDTO
{
    #[Assert\NotBlank]
    #[Assert\Type('float')]
    #[Assert\Range(
        notInRangeMessage: 'Latitude must be between -90 and 90',
        min: -90,
        max: 90
    )]
    public ?float $latitude = null;

    #[Assert\NotBlank]
    #[Assert\Type('float')]
    #[Assert\Range(
        notInRangeMessage: 'Longitude must be between -180 and 180',
        min: -180,
        max: 180
    )]
    public ?float $longitude = null;
}

