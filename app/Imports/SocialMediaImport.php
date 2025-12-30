<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow; // <--- Import this

class SocialMediaImport implements ToCollection, WithHeadingRow // <--- Add interface
{
    /**
    * @param Collection $collection
    */
    public function collection(Collection $rows)
    {
        // We won't process everything here instantly. 
        // We just want to return the rows to the controller 
        // so we can calculate stats there.
        return $rows;
    }
}