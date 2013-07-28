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
    my $thread_id = $cgi->param('thread') || "";
    my $board = $cgi->param('board') || "none";
    my $post = $cgi->param('post') || "";
    my $view = $cgi->param('view');
    $view = $view eq "catalog" ? "show_catalog" :
        $view eq "res" ?
            $cgi->param('js') ? "show_js" :
            $cgi->param('post') ? "show_post" :
            "none" :
        $view eq "board" ?
            $thread_id ? "show_thread" : "show_board" :
            "none";

    my $db = Database->new("$data_folder/data.db");

    my $vars = {
        post_id => $post,
        thread_id => $thread_id,
        board_name => $board,
    };

    print $cgi->header();

    &{$view}($cgi,$db,$vars);
}

sub show_js {
    my ($cgi, $db, $vars) = @_;

    print "// nevermind...\n";
    print $tx->render('page_vars.tx', $vars);
}
sub show_post {
    my ($cgi, $db, $vars) = @_;

    $vars->{p} = $db->get_full_post(1,$vars->{post_id});

    print $tx->render('post.tx', $vars);
}

sub show_thread {
    my ($cgi, $db, $vars) = @_;

    $vars->{post_list} = $db->get_thread(1,$vars->{thread_id});
    $vars->{board_list} = $db->get_board_list();

    print $tx->render('thread.tx', $vars);
}

sub show_board {
    my ($cgi,$db,$vars) = @_;
    my $page = $cgi->param('page') || 0;

    my $order = 0;
    my $limit = 6;
    my $offset = $page * $limit;

    my $thread_list = $db->get_thread_stubs(1,$limit,$offset);

    $vars->{total_threads} = $db->get_total_threads(1);
    my $max_pages = ceil($vars->{total_threads} / $limit);
    my @page_list = (0..($max_pages - 1));

    $vars->{page} = $cgi->escapeHTML($page);
    $vars->{prev_page} = $page - 1;
    $vars->{next_page} = $page + 1;
    $vars->{max_pages} = $max_pages;
    $vars->{page_list} = \@page_list;
    $vars->{thread_list} = $thread_list;
    $vars->{board_list} = $db->get_board_list();

    print $tx->render('board.tx', $vars);
}

sub show_catalog {
    my ($cgi,$db,$vars) = @_;

    $vars->{thread_list} = $db->get_thread_list(1);
    $vars->{board_list} = $db->get_board_list();

    print $tx->render('catalog.tx', $vars);
}
