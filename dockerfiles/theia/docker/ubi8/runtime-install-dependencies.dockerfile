# need root user
USER root

ARG SSHPASS_VERSION="1.06"

# Install sudo
# Install git
# Install bzip2 to unpack files
# Install which tool in order to search git
# Install curl and bash
# Install ssh for cloning ssh-repositories
# Install less for handling git diff properly
# Install sshpass for handling passwords for SSH keys
# Install libsecret as Theia requires it
RUN yum install -y sudo git bzip2 which bash curl openssh less libsecret libsecret-devel && \
    curl -ssl https://netcologne.dl.sourceforge.net/project/sshpass/sshpass/"${SSHPASS_VERSION}"/sshpass-"${SSHPASS_VERSION}".tar.gz -o sshpass.tar.gz && \
    tar -xvf sshpass.tar.gz && cd sshpass-"${SSHPASS_VERSION}" && ./configure && make install && cd .. && rm -rf sshpass-"${SSHPASS_VERSION}" && \
    yum -y clean all && rm -rf /var/cache/yum
