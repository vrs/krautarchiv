#!/usr/bin/perl

use strict;
no strict "refs";
use warnings;

use lib ("./modules","./domain");

use CGI::Fast;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser);
use POSIX;
use Text::Xslate;

use Database;
use Utilities;


my $file_folder = "img";
my $thumb_folder = "thumb";
my $data_folder = "data";

my $tx = Text::Xslate->new(
    path => ['templates/'],
    verbose => 2
);

while(my $cgi = new CGI::Fast) {
    $cgi->charset('utf-8');
    main($cgi);
}

sub main {
    my ($cgi) = shift;
    my $thread = $cgi->param('thread') || "";
    my $board = $cgi->param('board') || "none";
    my $post = $cgi->param('post') || "";
    my $view = $post ? "show_post" :
        $thread ? "show_thread" :
        "show_board";

    my $db = Database->new("$data_folder/data.db");

    my $vars = {
        post => $post,
        thread => $thread,
        board => $board,
    };

    print $cgi->header();

    #print $view, $board, $post, $cgi->url(-query => 1, -rewrite => 0), "\n";
    &{$view}($cgi,$db,$vars);
}

sub show_post {
    my ($cgi, $db, $vars) = @_;
    
    print $tx->render('post.tx', $vars);
}

sub show_thread {
    my ($cgi, $db, $vars) = @_;

    $vars->{post_list} = $db->get_thread(1,$vars->{thread});
    $vars->{board_list} = $db->get_board_list();

    print $tx->render('thread.tx', $vars);
}
