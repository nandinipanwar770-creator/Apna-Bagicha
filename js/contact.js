$(document).ready(function () {

  /* ── SEND MESSAGE ── */
  $("#send").click(function () {
    var name  = $("#name").val().trim();
    var email = $("#email").val().trim();
    var phone = $("#phone").val().trim();
    var msg   = $("#msg").val().trim();

    if (!name || !email || !msg) {
      $("#result").css("color", "#dc2626").text("Please fill in Name, Email and Message.");
      return;
    }

    var emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!email.match(emailPattern)) {
      $("#result").css("color", "#dc2626").text("Please enter a valid email address.");
      return;
    }

    // Disable button while sending
    var $btn = $("#send");
    $btn.prop("disabled", true).css("opacity", "0.7").find("svg").hide();
    $btn.contents().filter(function(){ return this.nodeType === 3; }).last().replaceWith("Sending…");

    $.ajax({
      url: "/send-message",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ name: name, email: email, phone: phone, message: msg }),
      success: function (res) {
        if (res.success) {
          var $ty = $('#contactThankYou');
          $ty.css('display', 'flex');
          $ty.find('.ty-spark, .ty-circle, .ty-heading, .ty-subtext, .ty-emoji').addClass('go');
          setTimeout(function () {
            $ty.addClass('ty-out');
            setTimeout(function () {
              $ty.css('display', 'none').removeClass('ty-out');
              $ty.find('.ty-spark, .ty-circle, .ty-heading, .ty-subtext, .ty-emoji').removeClass('go');
              $('#name, #email, #phone, #msg').val('');
              $('#result').text('');
            }, 450);
          }, 10000);
        } else {
          $("#result").css("color", "#dc2626").text(res.error || "Failed to send. Please try again.");
        }
      },
      error: function () {
        $("#result").css("color", "#dc2626").text("Network error. Please try again.");
      },
      complete: function () {
        $btn.prop("disabled", false).css("opacity", "1");
        $btn.find("svg").show();
        $btn.contents().filter(function(){ return this.nodeType === 3; }).last().replaceWith(" Send Message");
      }
    });
  });

  /* ── FADE ANIMATION ── */
  function runAnimation() {
    $(".fade-up").removeClass("show");
    setTimeout(function () { $(".fade-up").addClass("show"); }, 200);
  }
  runAnimation();
  setInterval(runAnimation, 10000);
});
