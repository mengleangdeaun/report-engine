<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LandingPageController extends Controller
{
    /**
     * Get the public landing page configuration.
     */
    public function getConfig()
    {
        $setting = Setting::where('group', 'landing_page')->where('key', 'config')->first();

        if ($setting) {
            $config = json_decode($setting->value, true);
            return response()->json($config);
        }

        // Return default configuration if none exists
        return response()->json([
            'companyName' => 'Report Maker',
            'contactEmail' => '',
            'contactPhone' => '',
            'contactAddress' => '',
            'googleMapLink' => '',
            'fontFamily' => 'Nunito',
            'themeColors' => ['primary' => 'blue', 'secondary' => 'purple', 'accent' => 'cyan'],
            'sectionOrder' => [
                ['id' => 'hero', 'name' => 'Hero', 'enabled' => true],
                ['id' => 'features', 'name' => 'Features', 'enabled' => true],
                ['id' => 'about', 'name' => 'About', 'enabled' => false],
                ['id' => 'whyUs', 'name' => 'Why Us', 'enabled' => false],
                ['id' => 'screenshots', 'name' => 'Screenshots', 'enabled' => false],
                ['id' => 'reviews', 'name' => 'Reviews', 'enabled' => false],
                ['id' => 'faq', 'name' => 'FAQ', 'enabled' => false],
                ['id' => 'contact', 'name' => 'Contact', 'enabled' => false],
            ],
            'logoUrl' => null,
            'faviconUrl' => null,
            'header' => ['style' => 'transparent', 'enabled' => true, 'bgColor' => '#ffffff', 'textColor' => '#000000', 'buttonStyle' => 'solid'],
            'hero' => [
                'layout' => 'contentCenter',
                'enabled' => true,
                'style' => 'default',
                'height' => '100vh',
                'title' => 'Transform Your Reporting Workflow',
                'subtitle' => 'Automate your data analysis and generate beautiful, client-ready reports in minutes.',
                'badge' => '',
                'primaryBtnText' => 'Get Started Now',
                'primaryBtnLink' => '/auth/boxed-signup',
                'primaryBtnEnabled' => true,
                'secondaryBtnText' => 'Learn More',
                'secondaryBtnLink' => '#features',
                'secondaryBtnEnabled' => true,
                'imageUrl' => '',
                'imagePos' => 'right',
                'bgColor' => '#ffffff',
                'textColor' => '#000000',
                'bgOverlay' => false,
                'overlayColor' => 'rgba(0,0,0,0.5)',
            ],
            'footer' => [
                'enabled' => true,
                'content' => '',
                'description' => '',
                'socialLinks' => [],
                'footerLinks' => [],
            ],
            'features' => [
                'enabled' => true,
                'layout' => 'grid',
                'style' => 'default',
                'columns' => '3',
                'title' => 'Everything you need to succeed',
                'description' => 'Powerful tools designed to save you time and provide insights that drive growth.',
                'displayIcon' => true,
                'bgColor' => '#f8fafc',
                'imageUrl' => '',
                'boxes' => [
                    ['title' => 'Advanced Analytics', 'description' => 'Get deep insights into your campaign performance.', 'icon' => 'IconChartBar'],
                    ['title' => 'Automated Reporting', 'description' => 'Schedule beautifully formatted reports in seconds.', 'icon' => 'IconClock'],
                    ['title' => 'Team Collaboration', 'description' => 'Work together seamlessly with customizable roles.', 'icon' => 'IconUsers'],
                ],
            ],
            'screenshots' => ['enabled' => false, 'title' => '', 'subtitle' => '', 'gallery' => []],
            'whyUs' => ['enabled' => false, 'title' => '', 'subtitle' => '', 'reasons' => [], 'ctaTitle' => '', 'ctaSubtitle' => ''],
            'about' => ['enabled' => false, 'layout' => 'contentLeft', 'style' => 'default', 'imagePos' => 'right', 'title' => '', 'description' => '', 'storyTitle' => '', 'storyContent' => '', 'imageUrl' => '', 'bgColor' => '#ffffff', 'parallax' => false],
            'reviews' => ['enabled' => false, 'title' => '', 'subtitle' => '', 'testimonials' => []],
            'faq' => ['enabled' => false, 'title' => '', 'subtitle' => '', 'ctaText' => '', 'btnText' => '', 'btnUrl' => '', 'items' => []],
            'contact' => ['enabled' => false, 'title' => '', 'subtitle' => '', 'formTitle' => '', 'infoTitle' => '', 'infoDescription' => ''],
            'termsOfService' => '',
            'privacyPolicy' => '',
        ]);
    }

    /**
     * Generic configuration update, merges new payload with existing config.
     */
    public function updateConfig(Request $request)
    {
        // Get existing config or default
        $setting = Setting::firstOrNew([
            'group' => 'landing_page',
            'key' => 'config'
        ]);

        $config = $setting->exists ? json_decode($setting->value, true) : [];

        // Exclude specific file uploads as we handle them explicitly or via the separate upload endpoint
        $inputs = $request->except(['logo', 'favicon', 'removeLogo', 'removeFavicon']);

        // Dynamically process all incoming text fields and JSON strings
        foreach ($inputs as $key => $value) {
            // Attempt to decode as JSON if it's a string
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE && !is_numeric($value)) {
                    $config[$key] = $decoded;
                } else {
                    $config[$key] = $value;
                }
            } else {
                $config[$key] = $value;
            }
        }

        // Process static Logo & Favicon File Uploads (Legacy support)
        if ($request->hasFile('logo')) {
            if (!empty($config['logoPath']))
                Storage::disk('public')->delete($config['logoPath']);
            $path = $request->file('logo')->store('landing-page', 'public');
            $config['logoPath'] = $path;
            $config['logoUrl'] = Storage::url($path);
        }
        if ($request->input('removeLogo') == 'true') {
            if (!empty($config['logoPath']))
                Storage::disk('public')->delete($config['logoPath']);
            $config['logoPath'] = null;
            $config['logoUrl'] = null;
        }

        if ($request->hasFile('favicon')) {
            if (!empty($config['faviconPath']))
                Storage::disk('public')->delete($config['faviconPath']);
            $path = $request->file('favicon')->store('landing-page', 'public');
            $config['faviconPath'] = $path;
            $config['faviconUrl'] = Storage::url($path);
        }
        if ($request->input('removeFavicon') == 'true') {
            if (!empty($config['faviconPath']))
                Storage::disk('public')->delete($config['faviconPath']);
            $config['faviconPath'] = null;
            $config['faviconUrl'] = null;
        }

        $setting->value = json_encode($config);
        $setting->save();

        return response()->json([
            'message' => 'Landing page configuration updated successfully.',
            'config' => $config
        ]);
    }

    /**
     * Generic image upload endpoint for Builder components (Galleries, About images, Quill Editor).
     */
    public function uploadImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('image')->store('landing-page/uploads', 'public');

        return response()->json([
            'url' => Storage::url($path),
            'path' => $path
        ]);
    }
}
