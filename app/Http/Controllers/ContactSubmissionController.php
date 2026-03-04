<?php

namespace App\Http\Controllers;

use App\Models\ContactSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactSubmissionController extends Controller
{
    /**
     * Store a new contact submission from the public landing page.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $submission = ContactSubmission::create($validator->validated());

        // Here you could trigger an email notification to the site admin

        return response()->json([
            'message' => 'Thank you! Your message has been sent successfully.',
            'submission' => $submission
        ], 201);
    }

    /**
     * Get a list of contact submissions for the admin panel.
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $submissions = ContactSubmission::orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($submissions);
    }

    /**
     * Mark a submission as read or replied.
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:unread,read,replied',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $submission = ContactSubmission::findOrFail($id);
        $submission->status = $request->input('status');
        $submission->save();

        return response()->json([
            'message' => 'Status updated successfully.',
            'submission' => $submission
        ]);
    }

    /**
     * Delete a submission.
     */
    public function destroy($id)
    {
        $submission = ContactSubmission::findOrFail($id);
        $submission->delete();

        return response()->json(['message' => 'Submission deleted successfully.']);
    }
}
